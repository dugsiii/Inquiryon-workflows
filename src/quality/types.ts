export interface QualityMetric {
    name: string;
    score: number; // 0-10 scale
    weight: number; // 0-1 weight in overall score
    details?: string;
    suggestions?: string[];
    category: 'basic' | 'ai' | 'external' | 'domain';
  }
  
  export interface QualityResult {
    overallScore: number;
    metrics: QualityMetric[];
    passed: boolean;
    threshold: number;
    timestamp: Date;
    assessorTypes: string[];
  }
  
  export interface QualityConfig {
    threshold: number;
    enabledAssessors: string[];
    weights?: Record<string, number>;
    assessorConfigs?: Record<string, any>;
  }
  
  export interface ContentToAssess {
    text?: string;
    subject_line?: string;
    images?: string[];
    metadata?: Record<string, any>;
    type: 'newsletter' | 'blog' | 'email' | 'social' | 'generic';
  }
  
  export interface AssessorConfig {
    enabled: boolean;
    weight?: number;
    options?: Record<string, any>;
  }