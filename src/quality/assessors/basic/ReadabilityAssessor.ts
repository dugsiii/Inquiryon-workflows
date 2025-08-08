import { BaseAssessor } from '../BaseAssessor.js';
import { QualityMetric, ContentToAssess } from '../../types.js';

export class ReadabilityAssessor extends BaseAssessor {
  readonly name = 'readability';
  readonly category = 'basic' as const;
  readonly defaultWeight = 0.25;

  async assess(content: ContentToAssess, config: any = {}): Promise<QualityMetric> {
    if (!content.text) {
      return this.createMetric(5, 'No text content to analyze');
    }

    const text = content.text;
    const sentences = this.countSentences(text);
    const words = this.countWords(text);
    const syllables = this.countSyllables(text);

    // Simplified Flesch Reading Ease Score
    const avgSentenceLength = sentences > 0 ? words / sentences : 0;
    const avgSyllablesPerWord = words > 0 ? syllables / words : 0;
    
    const fleschScore = 206.835 - (1.015 * avgSentenceLength) - (84.6 * avgSyllablesPerWord);
    
    // Convert Flesch score (0-100) to our scale (0-10)
    let score = Math.max(0, Math.min(10, fleschScore / 10));
    
    const suggestions: string[] = [];
    const readabilityLevel = this.getReadabilityLevel(fleschScore);

    if (avgSentenceLength > 20) {
      score -= 1;
      suggestions.push('Break down long sentences (avg: ' + avgSentenceLength.toFixed(1) + ' words/sentence)');
    }

    if (avgSyllablesPerWord > 1.8) {
      score -= 0.5;
      suggestions.push('Use simpler words where possible');
    }

    if (fleschScore < 60) {
      suggestions.push('Content may be difficult to read for general audience');
    }

    return this.createMetric(
      score,
      `${readabilityLevel} (Flesch: ${fleschScore.toFixed(1)})`,
      suggestions
    );
  }

  private countSentences(text: string): number {
    return (text.match(/[.!?]+/g) || []).length;
  }

  private countWords(text: string): number {
    return text.split(/\s+/).filter(word => word.length > 0).length;
  }

  private countSyllables(text: string): number {
    const words = text.toLowerCase().split(/\s+/);
    return words.reduce((total, word) => {
      // Simple syllable counting
      const syllableCount = word
        .replace(/[^aeiouy]/g, '')
        .replace(/(.)\1+/g, '$1')
        .length || 1;
      return total + syllableCount;
    }, 0);
  }

  private getReadabilityLevel(fleschScore: number): string {
    if (fleschScore >= 90) return 'Very Easy';
    if (fleschScore >= 80) return 'Easy';
    if (fleschScore >= 70) return 'Fairly Easy';
    if (fleschScore >= 60) return 'Standard';
    if (fleschScore >= 50) return 'Fairly Difficult';
    if (fleschScore >= 30) return 'Difficult';
    return 'Very Difficult';
  }
}