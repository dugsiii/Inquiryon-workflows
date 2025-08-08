import { BaseAssessor } from '../BaseAssessor.js';
import { QualityMetric, ContentToAssess } from '../../types.js';

export class GrammarAssessor extends BaseAssessor {
  readonly name = 'grammar';
  readonly category = 'basic' as const;
  readonly defaultWeight = 0.3;

  async assess(content: ContentToAssess, config: any = {}): Promise<QualityMetric> {
    if (!content.text) {
      return this.createMetric(5, 'No text content to analyze');
    }

    const issues = this.findGrammarIssues(content.text);
    const score = Math.max(0, 10 - issues.length * 0.5);
    
    return this.createMetric(
      score,
      `${issues.length} potential issues detected`,
      issues.slice(0, 5) // Show top 5 issues
    );
  }

  private findGrammarIssues(text: string): string[] {
    const issues: string[] = [];

    // Spacing issues
    if (text.includes('  ')) {
      issues.push('Multiple consecutive spaces found');
    }
    if (text.includes(' ,') || text.includes(' .') || text.includes(' !') || text.includes(' ?')) {
      issues.push('Incorrect spacing before punctuation');
    }

    // Capitalization after periods
    const afterPeriods = text.match(/\.\s+[a-z]/g);
    if (afterPeriods && afterPeriods.length > 0) {
      issues.push('Missing capitalization after period');
    }

    // Common typos
    const commonTypos = [
      { wrong: /\bthe the\b/gi, suggestion: 'Duplicate "the" found' },
      { wrong: /\band and\b/gi, suggestion: 'Duplicate "and" found' },
      { wrong: /\bteh\b/gi, suggestion: 'Possible typo: "teh" should be "the"' },
      { wrong: /\byour\b/gi, suggestion: 'Check if "your" should be "you\'re"' }
    ];

    commonTypos.forEach(typo => {
      if (typo.wrong.test(text)) {
        issues.push(typo.suggestion);
      }
    });

    // Passive voice detection
    const passiveIndicators = [/\bwas\s+\w+ed\b/gi, /\bwere\s+\w+ed\b/gi, /\bbeing\s+\w+ed\b/gi];
    let passiveCount = 0;
    passiveIndicators.forEach(pattern => {
      const matches = text.match(pattern);
      if (matches) passiveCount += matches.length;
    });

    if (passiveCount > 3) {
      issues.push('Consider using active voice instead of passive voice');
    }

    // Run-on sentences (very basic detection)
    const longSentences = text.split(/[.!?]/).filter(sentence => 
      sentence.split(',').length > 4 || sentence.split(' ').length > 30
    );
    if (longSentences.length > 0) {
      issues.push('Some sentences may be too long or complex');
    }

    return Array.from(new Set(issues)); //set removes dups
  }
}