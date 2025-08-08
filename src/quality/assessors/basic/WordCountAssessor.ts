import { BaseAssessor } from '../BaseAssessor.js';
import { QualityMetric, ContentToAssess } from '../../types.js';

export class WordCountAssessor extends BaseAssessor {
  readonly name = 'word-count';
  readonly category = 'basic' as const;
  readonly defaultWeight = 0.15;

  async assess(content: ContentToAssess, config: any = {}): Promise<QualityMetric> {
    if (!content.text) {
      return this.createMetric(5, 'No text content to analyze');
    }

    const wordCount = content.text.split(/\s+/).filter(word => word.length > 0).length;
    const minWords = config.minWords || this.getDefaultMinWords(content.type);
    const maxWords = config.maxWords || this.getDefaultMaxWords(content.type);

    let score = 10;
    const suggestions: string[] = [];

    if (wordCount < minWords) {
      const shortage = minWords - wordCount;
      score = Math.max(0, 10 - (shortage / minWords) * 5);
      suggestions.push(`Add ${shortage} more words (current: ${wordCount}, target: ${minWords}+)`);
    } else if (wordCount > maxWords) {
      const excess = wordCount - maxWords;
      score = Math.max(5, 10 - (excess / maxWords) * 3);
      suggestions.push(`Consider reducing by ${excess} words (current: ${wordCount}, target: <${maxWords})`);
    }

    return this.createMetric(
      score,
      `${wordCount} words (target: ${minWords}-${maxWords})`,
      suggestions
    );
  }

  private getDefaultMinWords(type: string): number {
    const defaults = {
      newsletter: 300,
      blog: 800,
      email: 100,
      social: 10,
      generic: 200
    };
    return defaults[type as keyof typeof defaults] || defaults.generic;
  }

  private getDefaultMaxWords(type: string): number {
    const defaults = {
      newsletter: 1500,
      blog: 3000,
      email: 500,
      social: 100,
      generic: 1000
    };
    return defaults[type as keyof typeof defaults] || defaults.generic;
  }
}