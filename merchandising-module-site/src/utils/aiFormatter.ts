/**
 * AI-Powered Answer Formatter
 * Automatically converts plain text answers into rich markdown format
 */

interface FormattingRule {
  pattern: RegExp;
  replacement: string;
  priority: number;
}

export class AIAnswerFormatter {
  private static instance: AIAnswerFormatter;
  private formattingRules: FormattingRule[];

  constructor() {
    this.formattingRules = this.initializeRules();
  }

  public static getInstance(): AIAnswerFormatter {
    if (!AIAnswerFormatter.instance) {
      AIAnswerFormatter.instance = new AIAnswerFormatter();
    }
    return AIAnswerFormatter.instance;
  }

  private initializeRules(): FormattingRule[] {
    return [
      // Headers - Convert numbered sections or important statements
      {
        pattern: /^(\d+\.\s*)([A-Z][^.\n]{20,}[.!?]?)$/gm,
        replacement: '## $2',
        priority: 1
      },
      {
        pattern: /^([A-Z][A-Z\s]{10,}):?\s*$/gm,
        replacement: '## $1',
        priority: 1
      },

      // Sub-headers for questions or definitions
      {
        pattern: /^(What is|How to|Why|When|Where)\s([^?\n]{10,}\??)$/gm,
        replacement: '### $1 $2',
        priority: 2
      },

      // Bold important terms and keywords (merchandising-specific)
      {
        pattern: /\b(size curve|merchandising|inventory|algorithm|important|critical|essential|key|main|primary|significant|crucial)\b/gi,
        replacement: '**$1**',
        priority: 3
      },

      // Bold numbers and percentages
      {
        pattern: /\b(\d+(?:\.\d+)?%?)\b/g,
        replacement: '**$1**',
        priority: 3
      },

      // Italic emphasis for descriptive terms
      {
        pattern: /\b(typically|usually|generally|commonly|often|sometimes|occasionally|particularly|especially|specifically)\b/gi,
        replacement: '*$1*',
        priority: 4
      },

      // Code formatting for technical terms (merchandising-specific)
      {
        pattern: /\b([a-z_]+_[a-z_]+|[A-Z][a-z]+[A-Z][a-z]*|API|SQL|JSON|XML|CSV|size_ratio|inventory_level|sales_data)\b/g,
        replacement: '`$1`',
        priority: 5
      },

      // Convert enumerated items to markdown lists
      {
        pattern: /^(\d+[\.)]\s+)(.+)$/gm,
        replacement: '1. $2',
        priority: 6
      },

      // Convert bullet points to markdown lists
      {
        pattern: /^[•·-]\s+(.+)$/gm,
        replacement: '- $1',
        priority: 6
      },

      // Convert "First,", "Second,", etc. to numbered lists
      {
        pattern: /^(First|Second|Third|Fourth|Fifth|Sixth|Seventh|Eighth|Ninth|Tenth)[,:]?\s+(.+)$/gm,
        replacement: '1. $2',
        priority: 6
      },

      // Convert steps into numbered lists
      {
        pattern: /^(Step \d+[:.]\s+)(.+)$/gm,
        replacement: '1. $2',
        priority: 6
      },

      // Create blockquotes for important notes
      {
        pattern: /^(Note:|Important:|Warning:|Tip:|Remember:)\s*(.+)$/gm,
        replacement: '> **$1** $2',
        priority: 7
      }
    ];
  }

  /**
   * Analyzes text and determines appropriate formatting
   */
  private analyzeText(text: string): {
    hasLists: boolean;
    hasNumbers: boolean;
    hasSteps: boolean;
    hasDefinitions: boolean;
    complexity: 'simple' | 'moderate' | 'complex';
  } {
    const listIndicators = /^(\d+[\.)]\s+|[•·-]\s+|First|Second|Third|Step)/gm;
    const numberPattern = /\b\d+(?:\.\d+)?%?\b/g;
    const stepPattern = /\b(step|process|procedure|method|approach)\b/gi;
    const definitionPattern = /\b(is|are|means|refers to|defined as)\b/gi;

    const hasLists = listIndicators.test(text);
    const hasNumbers = numberPattern.test(text);
    const hasSteps = stepPattern.test(text);
    const hasDefinitions = definitionPattern.test(text);

    const sentences = text.split(/[.!?]+/).length;
    const words = text.split(/\s+/).length;

    let complexity: 'simple' | 'moderate' | 'complex' = 'simple';
    if (words > 200 || sentences > 10) complexity = 'complex';
    else if (words > 100 || sentences > 5) complexity = 'moderate';

    return {
      hasLists,
      hasNumbers,
      hasSteps,
      hasDefinitions,
      complexity
    };
  }

  /**
   * Applies intelligent paragraph structuring
   */
  private structureParagraphs(text: string): string {
    // Split into sentences
    const sentences = text.split(/(?<=[.!?])\s+/);
    
    if (sentences.length <= 3) return text;

    // Group related sentences
    const paragraphs: string[] = [];
    let currentParagraph: string[] = [];

    sentences.forEach((sentence, index) => {
      currentParagraph.push(sentence);

      // Start new paragraph after 2-3 sentences or on topic change
      const shouldBreak = currentParagraph.length >= 3 || 
                         this.detectTopicChange(sentence, sentences[index + 1]);

      if (shouldBreak && index < sentences.length - 1) {
        paragraphs.push(currentParagraph.join(' '));
        currentParagraph = [];
      }
    });

    if (currentParagraph.length > 0) {
      paragraphs.push(currentParagraph.join(' '));
    }

    return paragraphs.join('\n\n');
  }

  /**
   * Detects potential topic changes between sentences
   */
  private detectTopicChange(current: string, next: string): boolean {
    if (!next) return false;

    const topicChangeIndicators = [
      'however', 'additionally', 'furthermore', 'moreover',
      'on the other hand', 'in contrast', 'alternatively',
      'for example', 'for instance', 'such as'
    ];

    return topicChangeIndicators.some(indicator => 
      next.toLowerCase().startsWith(indicator.toLowerCase())
    );
  }

  /**
   * Creates an appropriate title/header from the first sentence
   */
  private generateTitle(text: string): string {
    const firstSentence = text.split(/[.!?]/)[0];
    if (firstSentence.length < 50 && firstSentence.length > 10) {
      return `# ${firstSentence.trim()}\n\n`;
    }
    return '';
  }

  /**
   * Main formatting function
   */
  public formatAnswer(rawText: string): string {
    if (!rawText || rawText.trim().length === 0) {
      return rawText;
    }

    // Skip if already formatted
    if (this.isAlreadyFormatted(rawText)) {
      return rawText;
    }

    let formatted = rawText.trim();

    // Analyze text characteristics
    const analysis = this.analyzeText(formatted);

    // Add title for complex answers
    if (analysis.complexity === 'complex') {
      const title = this.generateTitle(formatted);
      if (title) {
        formatted = title + formatted;
      }
    }

    // Structure paragraphs
    if (analysis.complexity !== 'simple') {
      formatted = this.structureParagraphs(formatted);
    }

    // Apply formatting rules based on priority
    const sortedRules = this.formattingRules.sort((a, b) => a.priority - b.priority);
    
    for (const rule of sortedRules) {
      formatted = formatted.replace(rule.pattern, rule.replacement);
    }

    // Clean up formatting issues
    formatted = this.cleanUpFormatting(formatted);

    // Add spacing for better readability
    formatted = this.improveSpacing(formatted);

    return formatted;
  }

  /**
   * Checks if text is already formatted with markdown
   */
  private isAlreadyFormatted(text: string): boolean {
    const markdownIndicators = [
      /#{1,6}\s+/,  // Headers
      /\*\*.*\*\*/,  // Bold
      /\*.*\*/,      // Italic
      /`.*`/,        // Code
      /^\s*[-*+]\s+/m, // Lists
      /^\s*\d+\.\s+/m, // Numbered lists
      /^>\s+/m       // Blockquotes
    ];

    return markdownIndicators.some(pattern => pattern.test(text));
  }

  /**
   * Cleans up formatting inconsistencies
   */
  private cleanUpFormatting(text: string): string {
    return text
      // Remove excessive bold formatting
      .replace(/\*\*(\*\*.*?\*\*)\*\*/g, '$1')
      // Fix spacing around headers
      .replace(/^(#{1,6})\s*/gm, '$1 ')
      // Ensure proper list formatting
      .replace(/^(\d+)\.\s*(.+)$/gm, '$1. $2')
      .replace(/^-\s*(.+)$/gm, '- $1')
      // Remove duplicate formatting
      .replace(/(\*\*.*?\*\*)\s*(\*\*.*?\*\*)/g, '$1 $2')
      // Clean up extra whitespace
      .replace(/\n{3,}/g, '\n\n')
      .trim();
  }

  /**
   * Improves spacing for better readability
   */
  private improveSpacing(text: string): string {
    return text
      // Add space before headers
      .replace(/^(#{1,6}\s+)/gm, '\n$1')
      // Add space before lists
      .replace(/^(\d+\.\s+|-\s+)/gm, '\n$1')
      // Add space before blockquotes
      .replace(/^(>\s+)/gm, '\n$1')
      // Clean up excessive newlines
      .replace(/\n{3,}/g, '\n\n')
      .trim();
  }

  /**
   * Formats specific content types
   */
  public formatByType(text: string, type: 'definition' | 'process' | 'list' | 'comparison'): string {
    const baseFormatted = this.formatAnswer(text);

    switch (type) {
      case 'definition':
        return this.formatDefinition(baseFormatted);
      case 'process':
        return this.formatProcess(baseFormatted);
      case 'list':
        return this.formatList(baseFormatted);
      case 'comparison':
        return this.formatComparison(baseFormatted);
      default:
        return baseFormatted;
    }
  }

  private formatDefinition(text: string): string {
    // Add emphasis to the term being defined
    return text.replace(/^([A-Z][a-z\s]+)\s+(is|are|means|refers to)/gm, '**$1** $2');
  }

  private formatProcess(text: string): string {
    // Ensure steps are properly numbered
    const steps = text.split(/(?=\d+\.|First|Second|Third|Step)/);
    return steps.map((step, index) => {
      if (index === 0) return step;
      return step.replace(/^(.+)$/, `${index}. $1`);
    }).join('\n');
  }

  private formatList(text: string): string {
    // Convert comma-separated items to bullet points
    if (!text.includes('\n') && text.includes(',')) {
      const items = text.split(',').map(item => item.trim());
      if (items.length > 2) {
        return items.map(item => `- ${item}`).join('\n');
      }
    }
    return text;
  }

  private formatComparison(text: string): string {
    // Add table formatting for comparisons
    return text.replace(/(versus|vs\.?|compared to)/gi, '**$1**');
  }
}

// Export singleton instance
export const aiFormatter = AIAnswerFormatter.getInstance();