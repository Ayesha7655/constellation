import { Injectable, Logger, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Resend } from 'resend';
import { EmailTemplateService } from './email-template.service';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private readonly resend: Resend | null;

  constructor(
    private readonly configService: ConfigService,
    private readonly emailTemplateService: EmailTemplateService,
  ) {
    const apiKey = this.configService.get<string>('RESEND_API_KEY');
    this.resend = apiKey ? new Resend(apiKey) : null;
  }

  private getFromAddress(): string {
    return this.configService.get<string>('RESEND_FROM_EMAIL') ?? 'Constellation <onboarding@resend.dev>';
  }

  private assertConfigured(): Resend {
    if (!this.resend) {
      throw new ServiceUnavailableException('Email service is not configured');
    }
    return this.resend;
  }

  /** Whether Resend is configured (a `RESEND_API_KEY` is present). Lets callers gate optional email sends. */
  isConfigured(): boolean {
    return this.resend !== null;
  }

  /**
   * Generic transactional send for ready-rendered HTML (used by the notification email channel). Content
   * shaping/escaping is the caller's responsibility; this only delivers via Resend. On failure it logs a
   * redacted line (no raw error object → no recipient/header leakage) and throws a generic error so callers
   * persist a clean, PII-free reason.
   */
  async sendNotificationEmail(params: { to: string; subject: string; html: string }): Promise<void> {
    const resend = this.assertConfigured();
    const { error } = await resend.emails.send({
      from: this.getFromAddress(),
      to: params.to,
      subject: params.subject,
      html: params.html,
    });
    if (error) {
      this.logger.error(`Resend notification email failed: ${error.name}: ${error.message}`);
      throw new ServiceUnavailableException('Could not send email. Please try again later.');
    }
  }

  async sendPasswordResetEmail(params: { to: string; resetLink: string }): Promise<void> {
    const resend = this.assertConfigured();
    const { error } = await resend.emails.send({
      from: this.getFromAddress(),
      to: params.to,
      subject: 'Reset your Constellation password',
      html: this.emailTemplateService.renderPasswordReset(params.resetLink),
    });
    if (error) {
      this.logger.error('Resend password reset failed', error);
      throw new ServiceUnavailableException('Could not send email. Please try again later.');
    }
  }

  async sendEmailVerificationEmail(params: { to: string; verifyLink: string }): Promise<void> {
    const resend = this.assertConfigured();
    const { error } = await resend.emails.send({
      from: this.getFromAddress(),
      to: params.to,
      subject: 'Verify your Constellation email',
      html: this.emailTemplateService.renderEmailVerification(params.verifyLink),
    });
    if (error) {
      this.logger.error('Resend verification email failed', error);
      throw new ServiceUnavailableException('Could not send email. Please try again later.');
    }
  }

  async sendTeamApplicationReceivedEmail(params: { to: string; applicantName: string }): Promise<void> {
    const resend = this.assertConfigured();
    const name = this.emailTemplateService.escapeHtml(params.applicantName);
    const { error } = await resend.emails.send({
      from: this.getFromAddress(),
      to: params.to,
      subject: 'We received your Constellation team application',
      html: `<p>Hi ${name},</p><p>Thank you for applying to join Constellation. Our team will review your application and email you when a decision is made.</p>`,
    });
    if (error) {
      this.logger.error('Team application received email failed', error);
      throw new ServiceUnavailableException('Could not send email. Please try again later.');
    }
  }

  async sendTeamApplicationApprovedEmail(params: { to: string; applicantName: string }): Promise<void> {
    const resend = this.assertConfigured();
    const name = this.emailTemplateService.escapeHtml(params.applicantName);
    const { error } = await resend.emails.send({
      from: this.getFromAddress(),
      to: params.to,
      subject: 'Your Constellation team application was approved',
      html: `<p>Hi ${name},</p><p>Your application to join Constellation has been approved. You can now sign in and access your dashboard.</p>`,
    });
    if (error) {
      this.logger.error('Team application approved email failed', error);
      throw new ServiceUnavailableException('Could not send email. Please try again later.');
    }
  }

  async sendTeamApplicationRejectedEmail(params: {
    to: string;
    applicantName: string;
    reason?: string;
  }): Promise<void> {
    const resend = this.assertConfigured();
    const name = this.emailTemplateService.escapeHtml(params.applicantName);
    const reasonBlock = params.reason ? `<p>Reason: ${this.emailTemplateService.escapeHtml(params.reason)}</p>` : '';
    const { error } = await resend.emails.send({
      from: this.getFromAddress(),
      to: params.to,
      subject: 'Update on your Constellation team application',
      html: `<p>Hi ${name},</p><p>Unfortunately we cannot approve your application at this time.</p>${reasonBlock}`,
    });
    if (error) {
      this.logger.error('Team application rejected email failed', error);
      throw new ServiceUnavailableException('Could not send email. Please try again later.');
    }
  }
}
