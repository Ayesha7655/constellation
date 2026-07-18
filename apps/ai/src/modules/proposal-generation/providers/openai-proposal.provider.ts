import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type {
  ExtractStylePackRequest,
  GenerateProposalRequest,
  ProposalStylePreferences,
} from '@constellation/shared';
import OpenAI from 'openai';
import {
  buildUpworkProposalUserPrompt,
  getUpworkProposalSystemPrompt,
} from '../../../common/prompts/builders/upwork-proposal.prompt';
import {
  buildUpworkStyleExtractUserPrompt,
  getUpworkStyleExtractSystemPrompt,
} from '../../../common/prompts/builders/upwork-style-extract.prompt';
import { upworkProposalSchema } from '../schemas/upwork-proposal.schema';
import { upworkStylePackSchema } from '../schemas/upwork-style-pack.schema';

@Injectable()
export class OpenAiProposalProvider {
  private readonly logger = new Logger(OpenAiProposalProvider.name);

  constructor(private readonly configService: ConfigService) {}

  isConfigured(): boolean {
    const apiKey = this.configService.get<string>('OPENAI_API_KEY')?.trim();
    return Boolean(apiKey && !apiKey.includes('example'));
  }

  async generate(input: GenerateProposalRequest): Promise<string | null> {
    const apiKey = this.configService.get<string>('OPENAI_API_KEY')?.trim();
    if (!apiKey || apiKey.includes('example')) return null;

    const client = new OpenAI({ apiKey });
    const completion = await client.chat.completions.create({
      model: this.configService.get<string>('OPENAI_MODEL')?.trim() || 'gpt-4o-mini',
      temperature: 0.4,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: getUpworkProposalSystemPrompt() },
        {
          role: 'user',
          content: buildUpworkProposalUserPrompt({
            stylePack: input.stylePack as Record<string, unknown>,
            profile: input.profile as unknown as Record<string, unknown>,
            job: input.job as unknown as Record<string, unknown>,
            examples: input.examples as unknown as Array<Record<string, unknown>>,
          }),
        },
      ],
    });

    const content = completion.choices[0]?.message?.content;
    if (!content) return null;

    try {
      const parsed: unknown = JSON.parse(content);
      const result = upworkProposalSchema.safeParse(parsed);
      if (!result.success) {
        this.logger.warn(`OpenAI response failed proposal validation: ${result.error.message}`);
        return null;
      }
      return result.data.body;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown model output error';
      this.logger.warn(`OpenAI proposal output could not be parsed; using fallback: ${message}`);
      return null;
    }
  }

  async extractStylePack(input: ExtractStylePackRequest): Promise<ProposalStylePreferences | null> {
    const apiKey = this.configService.get<string>('OPENAI_API_KEY')?.trim();
    if (!apiKey || apiKey.includes('example')) return null;

    const client = new OpenAI({ apiKey });
    const completion = await client.chat.completions.create({
      model: this.configService.get<string>('OPENAI_MODEL')?.trim() || 'gpt-4o-mini',
      temperature: 0.2,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: getUpworkStyleExtractSystemPrompt() },
        {
          role: 'user',
          content: buildUpworkStyleExtractUserPrompt(
            input.examples as unknown as Array<Record<string, unknown>>,
          ),
        },
      ],
    });

    const content = completion.choices[0]?.message?.content;
    if (!content) return null;

    try {
      const parsed: unknown = JSON.parse(content);
      const result = upworkStylePackSchema.safeParse(parsed);
      if (!result.success) {
        this.logger.warn(`OpenAI response failed style-pack validation: ${result.error.message}`);
        return null;
      }
      return {
        tone: result.data.tone ?? null,
        lengthTarget: result.data.lengthTarget ?? null,
        structureNotes: result.data.structureNotes ?? null,
        alwaysUse: result.data.alwaysUse ?? [],
        neverUse: result.data.neverUse ?? [],
        rateMentionPolicy: result.data.rateMentionPolicy ?? null,
        ctaStyle: result.data.ctaStyle ?? null,
        extraNotes: result.data.extraNotes ?? null,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown model output error';
      this.logger.warn(`OpenAI style-pack output could not be parsed; using fallback: ${message}`);
      return null;
    }
  }
}
