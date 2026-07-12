import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  OnModuleInit,
  ServiceUnavailableException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AUTH_ERROR_CODES } from '@constellation/shared';
import * as bcrypt from 'bcryptjs';
import * as admin from 'firebase-admin';
import type { DecodedIdToken, UserImportRecord } from 'firebase-admin/auth';
import { codedTooManyRequests } from '../../common/exceptions/coded-http.exception';
import {
  buildAppActionLink,
  getWebActionCodeSettings,
  type AppAuthActionPath,
} from '../../common/utils/firebase-action-link';
import { isFirebaseUserNotFoundError } from '../../common/utils/firebase-auth-error';
import { getWebUrl } from '../../common/utils/web-url';

@Injectable()
export class FirebaseService implements OnModuleInit {
  private readonly logger = new Logger(FirebaseService.name);

  constructor(private readonly configService: ConfigService) {}

  onModuleInit(): void {
    if (admin.apps.length > 0) {
      return;
    }

    const projectId = this.configService.get<string>('FIREBASE_PROJECT_ID');
    const clientEmail = this.configService.get<string>('FIREBASE_CLIENT_EMAIL');
    const privateKey = (this.configService.get<string>('FIREBASE_PRIVATE_KEY') ?? '').replace(/\\n/g, '\n');

    if (!projectId || !clientEmail || !privateKey) {
      const message =
        'Firebase Admin SDK not configured — set FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY';
      if (this.configService.get<string>('NODE_ENV') === 'test') {
        this.logger.warn(message);
        return;
      }
      throw new Error(message);
    }

    admin.initializeApp({
      credential: admin.credential.cert({ projectId, clientEmail, privateKey }),
    });
    this.logger.log('Firebase Admin SDK initialized');
  }

  private assertInitialized(): void {
    if (admin.apps.length === 0) {
      throw new ServiceUnavailableException('Authentication service is not configured');
    }
  }

  async verifyIdToken(idToken: string): Promise<DecodedIdToken> {
    this.assertInitialized();
    try {
      return await admin.auth().verifyIdToken(idToken);
    } catch (error) {
      this.logger.warn('Firebase verifyIdToken failed', error);
      throw new UnauthorizedException('Invalid Firebase token');
    }
  }

  async deleteUser(uid: string): Promise<void> {
    this.assertInitialized();
    await admin.auth().deleteUser(uid);
  }

  async generateAppActionLink(email: string, path: AppAuthActionPath): Promise<string> {
    this.assertInitialized();
    const webUrl = getWebUrl(this.configService);
    const settings = getWebActionCodeSettings(webUrl, path);
    const firebaseLink =
      path === 'reset-password'
        ? await admin.auth().generatePasswordResetLink(email, settings)
        : await admin.auth().generateEmailVerificationLink(email, settings);
    return buildAppActionLink(firebaseLink, webUrl, path, {
      email: path === 'verify-email' ? email : undefined,
    });
  }

  async confirmPasswordReset(oobCode: string, newPassword: string): Promise<string> {
    const apiKey = this.getFirebaseWebApiKey();
    const response = await fetch(
      `https://identitytoolkit.googleapis.com/v1/accounts:resetPassword?key=${encodeURIComponent(apiKey)}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ oobCode, newPassword }),
      },
    );

    if (!response.ok) {
      this.logger.warn('Firebase accounts:resetPassword failed', await this.readIdentityToolkitError(response));
      throw new BadRequestException('This reset link is invalid or has expired.');
    }

    const body: unknown = await response.json();
    if (typeof body === 'object' && body !== null && 'email' in body && typeof body.email === 'string') {
      return body.email;
    }

    throw new BadRequestException('This reset link is invalid or has expired.');
  }

  async applyEmailVerificationOobCode(oobCode: string): Promise<string> {
    const apiKey = this.getFirebaseWebApiKey();
    const response = await fetch(
      `https://identitytoolkit.googleapis.com/v1/accounts:update?key=${encodeURIComponent(apiKey)}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ oobCode }),
      },
    );

    if (!response.ok) {
      this.logger.warn('Firebase accounts:update failed', await this.readIdentityToolkitError(response));
      throw new BadRequestException('This verification link is invalid or has expired.');
    }

    const body: unknown = await response.json();
    if (typeof body === 'object' && body !== null && 'email' in body && typeof body.email === 'string') {
      return (body as { email: string }).email;
    }

    throw new BadRequestException('This verification link is invalid or has expired.');
  }

  private getFirebaseWebApiKey(): string {
    const apiKey = this.configService.get<string>('FIREBASE_WEB_API_KEY');
    if (!apiKey) {
      throw new ServiceUnavailableException('Firebase web API key is not configured');
    }
    return apiKey;
  }

  async getUserByEmail(email: string): Promise<admin.auth.UserRecord | null> {
    this.assertInitialized();
    try {
      return await admin.auth().getUserByEmail(email);
    } catch (error) {
      if (isFirebaseUserNotFoundError(error)) {
        return null;
      }
      this.logger.warn(`Firebase getUserByEmail failed for ${email}`, error);
      throw new ServiceUnavailableException('Authentication service is temporarily unavailable');
    }
  }

  /** Team onboarding applicant — create unverified email/password Firebase user. */
  async createApplicantPasswordUser(params: { email: string; password: string; displayName: string }): Promise<string> {
    this.assertInitialized();
    const normalizedEmail = params.email.trim().toLowerCase();
    const existing = await this.getUserByEmail(normalizedEmail);
    if (existing) {
      throw new ConflictException('Email already registered');
    }

    const created = await admin.auth().createUser({
      email: normalizedEmail,
      password: params.password,
      displayName: params.displayName,
      emailVerified: false,
    });
    return created.uid;
  }

  /** Dev seed — create or update unverified applicant; idempotent for re-runs. */
  async upsertApplicantPasswordUser(params: { email: string; password: string; displayName: string }): Promise<string> {
    this.assertInitialized();
    const normalizedEmail = params.email.trim().toLowerCase();
    const existing = await this.getUserByEmail(normalizedEmail);
    if (existing) {
      await admin.auth().updateUser(existing.uid, {
        password: params.password,
        displayName: params.displayName,
        emailVerified: false,
      });
      return existing.uid;
    }

    const created = await admin.auth().createUser({
      email: normalizedEmail,
      password: params.password,
      displayName: params.displayName,
      emailVerified: false,
    });
    return created.uid;
  }

  /** Dev seed — bulk applicant Firebase users via a single importUsers call (bcrypt, max 1000). */
  async bulkUpsertApplicantPasswordUsers(
    records: readonly { email: string; displayName: string }[],
    password: string,
  ): Promise<Map<string, string>> {
    this.assertInitialized();
    if (records.length === 0) {
      return new Map();
    }
    if (records.length > 1000) {
      throw new BadRequestException('Firebase importUsers supports at most 1000 users per call');
    }

    const normalized = records.map((record) => ({
      email: record.email.trim().toLowerCase(),
      displayName: record.displayName,
    }));

    const passwordHashes = await Promise.all(normalized.map(() => bcrypt.hash(password, 10)));

    const importRecords: UserImportRecord[] = normalized.map((record, index) => {
      const passwordHash = passwordHashes[index];
      if (!passwordHash) {
        throw new Error('Missing bcrypt password hash for seed import');
      }
      return {
        uid: seedTeamApplicationApplicantUid(record.email),
        email: record.email,
        displayName: record.displayName,
        emailVerified: false,
        passwordHash: Buffer.from(passwordHash, 'utf8'),
      };
    });

    const result = await admin.auth().importUsers(importRecords, {
      hash: { algorithm: 'BCRYPT' },
    });

    if (result.errors.length > 0) {
      const detail = result.errors.map((entry) => `index ${entry.index}: ${entry.error.message}`).join('; ');
      this.logger.error(`Firebase importUsers failed for ${result.errors.length} user(s): ${detail}`);
      throw new ServiceUnavailableException('Failed to import seed Firebase users');
    }

    const emailToUid = new Map<string, string>();
    for (const record of normalized) {
      emailToUid.set(record.email, seedTeamApplicationApplicantUid(record.email));
    }
    return emailToUid;
  }

  /** Dev seed — remove Firebase users by uid in one bulk call (chunks only above Firebase 1000 limit). */
  async deleteUsersByUids(uids: readonly string[]): Promise<number> {
    this.assertInitialized();
    const uniqueUids = [...new Set(uids.map((uid) => uid.trim()).filter(Boolean))];
    if (uniqueUids.length === 0) {
      return 0;
    }

    if (uniqueUids.length <= 1000) {
      return this.runBulkDeleteUsers(uniqueUids);
    }

    const chunks: string[][] = [];
    for (let offset = 0; offset < uniqueUids.length; offset += 1000) {
      chunks.push(uniqueUids.slice(offset, offset + 1000));
    }
    const deletedCounts = await Promise.all(chunks.map((chunk) => this.runBulkDeleteUsers(chunk)));
    return deletedCounts.reduce((total, count) => total + count, 0);
  }

  private async runBulkDeleteUsers(uids: readonly string[]): Promise<number> {
    const result = await admin.auth().deleteUsers([...uids]);
    if (result.errors.length > 0) {
      const detail = result.errors.map((entry) => `uid ${entry.index}: ${entry.error.message}`).join('; ');
      this.logger.warn(`Firebase deleteUsers partial failure: ${detail}`);
    }
    return result.successCount;
  }

  async updateApplicantPasswordUser(params: { uid: string; password: string; displayName: string }): Promise<void> {
    this.assertInitialized();
    await admin.auth().updateUser(params.uid, {
      password: params.password,
      displayName: params.displayName,
      emailVerified: false,
    });
  }

  /** Team onboarding — mark applicant email verified after admin approval. */
  async verifyApplicantEmail(uid: string): Promise<void> {
    this.assertInitialized();
    await admin.auth().updateUser(uid, { emailVerified: true });
  }

  /** Dev/staging seed — create or update an email/password Firebase user. */
  async upsertPasswordUser(params: { email: string; password: string; displayName: string }): Promise<string> {
    this.assertInitialized();
    const existing = await this.getUserByEmail(params.email);
    if (existing) {
      await admin.auth().updateUser(existing.uid, {
        password: params.password,
        displayName: params.displayName,
        emailVerified: true,
      });
      return existing.uid;
    }

    const created = await admin.auth().createUser({
      email: params.email,
      password: params.password,
      displayName: params.displayName,
      emailVerified: true,
    });
    return created.uid;
  }

  /** Dev seed — bulk-delete team-application seed Firebase users by known seed emails (no listUsers). */
  async deleteTeamApplicationSeedAuthUsers(seedEmails: readonly string[]): Promise<number> {
    const uids = seedEmails.map((email) => seedTeamApplicationApplicantUid(email.trim().toLowerCase()));
    return this.deleteUsersByUids(uids);
  }

  /** Dev/staging seed prep — delete every Firebase Auth user (fail on partial delete). */
  async deleteAllAuthUsers(): Promise<number> {
    this.assertInitialized();
    let deleted = 0;
    let pageToken: string | undefined;

    do {
      const page = await admin.auth().listUsers(1000, pageToken);
      if (page.users.length === 0) {
        break;
      }

      const uids = page.users.map((user) => user.uid);
      const result = await admin.auth().deleteUsers(uids);
      deleted += result.successCount;

      if (result.failureCount > 0) {
        const details = result.errors
          .map((error) => {
            const uid = uids[error.index] ?? `unknown-at-index-${error.index}`;
            return `${uid}: ${error.error.message}`;
          })
          .join('; ');
        throw new Error(`Failed to delete ${result.failureCount} Firebase user(s): ${details}`);
      }

      pageToken = page.pageToken;
    } while (pageToken);

    return deleted;
  }

  async revokeRefreshTokens(firebaseUid: string): Promise<void> {
    this.assertInitialized();
    await admin.auth().revokeRefreshTokens(firebaseUid);
  }

  /**
   * Verify a current password server-side via the Identity Toolkit REST API
   * (Admin SDK cannot check passwords). Returns false ONLY for genuine
   * wrong-password / unknown-credential responses; throws on throttling
   * (`429`) and other transient/non-auth failures so callers don't misreport
   * them as an incorrect password.
   */
  async verifyPassword(email: string, password: string): Promise<boolean> {
    const apiKey = this.getFirebaseWebApiKey();
    const response = await fetch(
      `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${encodeURIComponent(apiKey)}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, returnSecureToken: false }),
      },
    );

    if (response.ok) {
      return true;
    }

    const errorMessage = await this.readIdentityToolkitErrorMessage(response);
    const code = errorMessage.split(/[\s:]/)[0] ?? '';
    if (response.status === 400 && FIREBASE_CREDENTIAL_ERROR_CODES.has(code)) {
      this.logger.warn(`Firebase signInWithPassword rejected: ${code}`);
      return false;
    }
    if (errorMessage.includes('TOO_MANY_ATTEMPTS_TRY_LATER')) {
      this.logger.warn('Firebase signInWithPassword throttled');
      codedTooManyRequests(AUTH_ERROR_CODES.TOO_MANY_ATTEMPTS);
    }
    this.logger.error(`Firebase signInWithPassword failed: ${errorMessage || `HTTP ${response.status}`}`);
    throw new ServiceUnavailableException('Authentication service is temporarily unavailable');
  }

  /** Update a user's password via the Admin SDK (after server-side verification). */
  async updateUserPassword(uid: string, newPassword: string): Promise<void> {
    this.assertInitialized();
    await admin.auth().updateUser(uid, { password: newPassword });
  }

  async isEmailVerifiedInFirebase(email: string): Promise<boolean> {
    const user = await this.getUserByEmail(email);
    return user?.emailVerified === true;
  }

  /** Extract the Identity Toolkit `error.message` code (e.g. `INVALID_PASSWORD`), or '' if absent. */
  private async readIdentityToolkitErrorMessage(response: Response): Promise<string> {
    try {
      const parsed: unknown = await response.json();
      if (typeof parsed === 'object' && parsed !== null && 'error' in parsed) {
        const error = (parsed as { error?: unknown }).error;
        if (typeof error === 'object' && error !== null && 'message' in error && typeof error.message === 'string') {
          return (error as { message: string }).message;
        }
      }
    } catch {
      /* non-JSON body */
    }
    return '';
  }

  private async readIdentityToolkitError(response: Response): Promise<string> {
    const text = await response.text();
    try {
      const parsed: unknown = JSON.parse(text);
      if (typeof parsed === 'object' && parsed !== null && 'error' in parsed) {
        const error = parsed.error;
        if (typeof error === 'object' && error !== null) {
          const message =
            'message' in error && typeof error.message === 'string'
              ? (error as { message: string }).message
              : undefined;
          const status =
            'status' in error && typeof error.status === 'string' ? (error as { status: string }).status : undefined;
          return JSON.stringify({ status, message });
        }
      }
    } catch {
      /* fall through */
    }
    return `HTTP ${response.status}`;
  }

  /** ID tokens from some Google sign-ins omit `email`; Auth user record still has it. */
  async resolveUserEmail(uid: string): Promise<string | undefined> {
    if (admin.apps.length === 0) {
      return undefined;
    }
    try {
      const user = await admin.auth().getUser(uid);
      const google = user.providerData.find((provider) => provider.providerId === 'google.com');
      return google?.email ?? user.email ?? user.providerData.find((provider) => provider.email)?.email;
    } catch (error) {
      this.logger.warn(`Firebase getUser failed for uid=${uid}`, error);
      return undefined;
    }
  }
}

/** Identity Toolkit `signInWithPassword` codes that mean "wrong/unknown credentials" (not throttling). */
const FIREBASE_CREDENTIAL_ERROR_CODES = new Set([
  'INVALID_LOGIN_CREDENTIALS',
  'INVALID_PASSWORD',
  'EMAIL_NOT_FOUND',
  'MISSING_PASSWORD',
]);

/** Deterministic Firebase uid for team-application seed imports (re-run safe after bulk delete). */
function seedTeamApplicationApplicantUid(email: string): string {
  const localPart = email.split('@')[0] ?? 'unknown';
  const sanitized = localPart.replace(/[^a-zA-Z0-9-]/g, '-').slice(0, 100);
  return `seed-ta-${sanitized}`;
}
