import { Injectable, OnModuleInit, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { existsSync, readFileSync } from 'fs';
import { join } from 'path';
import { getWebUrl } from '../../common/utils/web-url';

type AuthEmailTemplateId = 'password-reset' | 'email-verification';

type AuthEmailTemplateVars = Readonly<{
  actionLink: string;
  webUrl: string;
}>;

@Injectable()
export class EmailTemplateService implements OnModuleInit {
  private readonly templateCache = new Map<AuthEmailTemplateId, string>();

  constructor(private readonly configService: ConfigService) {}

  onModuleInit(): void {
    const templateIds: AuthEmailTemplateId[] = ['password-reset', 'email-verification'];
    for (const templateId of templateIds) {
      this.templateCache.set(templateId, readFileSync(this.resolveTemplatePath(templateId), 'utf8'));
    }
  }

  renderPasswordReset(actionLink: string): string {
    return this.render('password-reset', { actionLink });
  }

  renderEmailVerification(actionLink: string): string {
    return this.render('email-verification', { actionLink });
  }

  getAppWebUrl(): string {
    return getWebUrl(this.configService);
  }

  escapeHtml(value: string): string {
    return value.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;');
  }

  private render(templateId: AuthEmailTemplateId, vars: { actionLink: string }): string {
    const html = this.templateCache.get(templateId);
    if (!html) {
      throw new ServiceUnavailableException('Email templates are not available');
    }
    const data: AuthEmailTemplateVars = {
      actionLink: vars.actionLink,
      webUrl: this.getAppWebUrl(),
    };
    return this.interpolate(html, data);
  }

  private resolveTemplatePath(templateId: AuthEmailTemplateId): string {
    const fileName = `${templateId}.html`;
    const candidates = [
      join(__dirname, 'templates', fileName),
      join(process.cwd(), 'src', 'modules', 'email', 'templates', fileName),
    ];

    for (const candidate of candidates) {
      if (existsSync(candidate)) {
        return candidate;
      }
    }

    throw new ServiceUnavailableException('Email templates are not available');
  }

  private interpolate(template: string, vars: AuthEmailTemplateVars): string {
    return template
      .replaceAll('{{actionLink}}', this.escapeHtml(vars.actionLink))
      .replaceAll('{{webUrl}}', this.escapeHtml(vars.webUrl));
  }
}
