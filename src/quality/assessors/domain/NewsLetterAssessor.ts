import { BaseAssessor } from '../BaseAssessor.js';
import { QualityMetric, ContentToAssess } from '../../types.js';

export class NewsletterAssessor extends BaseAssessor {
  readonly name = 'newsletter-structure';
  readonly category = 'domain' as const;
  readonly defaultWeight = 0.2;

  async assess(content: ContentToAssess, config: any = {}): Promise<QualityMetric> {
    if (content.type !== 'newsletter') {
      return this.createMetric(10, 'Not a newsletter - assessment skipped');
    }

    let score = 10;
    const suggestions: string[] = [];
    const text = content.text?.toLowerCase() || '';

    // Required elements for newsletters
    const checks = [
      {
        condition: !content.subject_line || content.subject_line.length < 10,
        penalty: 2,
        suggestion: 'Add compelling subject line (at least 10 characters)'
      },
      {
        condition: !text.includes('unsubscribe'),
        penalty: 3,
        suggestion: 'Include unsubscribe link (legal requirement)'
      },
      {
        condition: !this.hasCallToAction(text),
        penalty: 1,
        suggestion: 'Add clear call-to-action'
      },
      {
        condition: !this.hasPersonalGreeting(text),
        penalty: 0.5,
        suggestion: 'Consider adding personal greeting'
      },
      {
        condition: !this.hasClosing(text),
        penalty: 0.5,
        suggestion: 'Add professional closing'
      },
      {
        condition: text.length < 200,
        penalty: 1,
        suggestion: 'Newsletter content seems too brief'
      }
    ];

    checks.forEach(check => {
      if (check.condition) {
        score -= check.penalty;
        suggestions.push(check.suggestion);
      }
    });

    return this.createMetric(
      Math.max(0, score),
      'Newsletter structure and compliance check',
      suggestions
    );
  }

  private hasCallToAction(text: string): boolean {
    const ctaWords = ['click', 'read more', 'learn more', 'sign up', 'subscribe', 'download', 'get', 'try'];
    return ctaWords.some(word => text.includes(word));
  }

  private hasPersonalGreeting(text: string): boolean {
    const greetings = ['hello', 'hi', 'hey', 'dear', 'greetings'];
    return greetings.some(greeting => text.includes(greeting));
  }

  private hasClosing(text: string): boolean {
    const closings = ['thanks', 'thank you', 'regards', 'best', 'sincerely', 'cheers'];
    return closings.some(closing => text.includes(closing));
  }
}