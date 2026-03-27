import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../common/prisma.service';
import { getDefaultProvider, DEFAULT_REGISTRY } from '@pet-central/ai-core';
import { AIChannelType } from '@pet-central/database';

interface AnalyzeDto {
  content: string;
  contentType: string;
  policies?: string[];
}

interface BatchItem {
  id: string;
  content: string;
  contentType: string;
}

export interface ModerationResult {
  itemId?: string;
  verdict: 'approve' | 'flag' | 'reject';
  confidence: number;
  reasons: string[];
  policyViolations: string[];
}

@Injectable()
export class ModerationAIService {
  private readonly logger = new Logger(ModerationAIService.name);

  constructor(private readonly prisma: PrismaService) {}

  async analyze(dto: AnalyzeDto): Promise<ModerationResult> {
    const template = DEFAULT_REGISTRY.get('moderation-review');
    const rendered = DEFAULT_REGISTRY.render('moderation-review', {
      content: dto.content,
      contentType: dto.contentType,
      policies: dto.policies?.join(', ') ?? 'default platform policies',
    });

    const provider = getDefaultProvider();
    const startTime = Date.now();
    const response = await provider.complete({
      systemPrompt: rendered.systemPrompt,
      messages: [{ role: 'user', content: rendered.userPrompt }],
    });
    const latencyMs = Date.now() - startTime;

    const result = this.parseModeration(response.content);

    await this.prisma.aIInteraction.create({
      data: {
        channelType: AIChannelType.INTERNAL_ASSISTANT,
        promptVersion: template?.version ?? 'unknown',
        modelName: response.model,
        inputSummary: `Moderation: ${dto.contentType} (${dto.content.length} chars)`,
        outputSummary: JSON.stringify({
          verdict: result.verdict,
          confidence: result.confidence,
        }),
      },
    });

    this.logger.log(
      `Moderation analysis completed in ${latencyMs}ms: verdict=${result.verdict}`,
    );

    return result;
  }

  async batchAnalyze(items: BatchItem[]): Promise<ModerationResult[]> {
    const results: ModerationResult[] = [];

    for (const item of items) {
      const result = await this.analyze({
        content: item.content,
        contentType: item.contentType,
      });

      results.push({ ...result, itemId: item.id });
    }

    this.logger.log(
      `Batch moderation completed: ${results.length} items processed`,
    );

    return results;
  }

  private parseModeration(content: string): ModerationResult {
    try {
      const parsed = JSON.parse(content);
      return {
        verdict: this.normalizeVerdict(parsed.verdict),
        confidence: typeof parsed.confidence === 'number' ? parsed.confidence : 0.5,
        reasons: Array.isArray(parsed.reasons) ? parsed.reasons : [],
        policyViolations: Array.isArray(parsed.policyViolations)
          ? parsed.policyViolations
          : [],
      };
    } catch {
      const lower = content.toLowerCase();
      let verdict: 'approve' | 'flag' | 'reject' = 'flag';
      if (lower.includes('approve') || lower.includes('safe')) {
        verdict = 'approve';
      } else if (lower.includes('reject') || lower.includes('violation')) {
        verdict = 'reject';
      }

      return {
        verdict,
        confidence: 0.5,
        reasons: [content.substring(0, 200)],
        policyViolations: [],
      };
    }
  }

  private normalizeVerdict(
    verdict: string,
  ): 'approve' | 'flag' | 'reject' {
    const v = (verdict ?? '').toLowerCase();
    if (v === 'approve' || v === 'safe' || v === 'pass') return 'approve';
    if (v === 'reject' || v === 'block' || v === 'violation') return 'reject';
    return 'flag';
  }
}
