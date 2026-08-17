export interface MatchResult {
  questionId: string;
  questionCode: string;
  subject: string;
  similarityScore: number; // 0.0 to 100.0
  matchedSnippet: string;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
}

export class LeakDetectionService {
  /**
   * Tokenizes text into normalized word n-grams.
   */
  private static tokenize(text: string): string[] {
    return text
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, '')
      .split(/\s+/)
      .filter((word) => word.length > 2);
  }

  /**
   * Calculates Jaccard / Cosine similarity score between two texts.
   */
  static calculateSimilarity(sampleText: string, vaultQuestionText: string): number {
    const tokensA = new Set(this.tokenize(sampleText));
    const tokensB = new Set(this.tokenize(vaultQuestionText));

    if (tokensA.size === 0 || tokensB.size === 0) return 0;

    let intersection = 0;
    for (const token of tokensA) {
      if (tokensB.has(token)) {
        intersection++;
      }
    }

    const union = new Set([...tokensA, ...tokensB]).size;
    const jaccard = (intersection / union) * 100;
    
    // Scale slightly for realistic match percentages on short queries
    const scaledScore = Math.min(100, jaccard * 2.2);
    return Math.round(scaledScore * 10) / 10;
  }

  /**
   * Compares leaked evidence text against a collection of decrypted vault questions.
   */
  static analyzeLeak(
    evidenceText: string,
    vaultQuestions: Array<{ id: string; questionCode: string; subject: string; plainTextContent: string }>
  ): MatchResult[] {
    const results: MatchResult[] = [];

    for (const q of vaultQuestions) {
      const score = this.calculateSimilarity(evidenceText, q.plainTextContent);
      if (score >= 25) {
        let riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' = 'LOW';
        if (score >= 85) riskLevel = 'CRITICAL';
        else if (score >= 65) riskLevel = 'HIGH';
        else if (score >= 45) riskLevel = 'MEDIUM';

        results.push({
          questionId: q.id,
          questionCode: q.questionCode,
          subject: q.subject,
          similarityScore: score,
          matchedSnippet: q.plainTextContent.substring(0, 100) + '...',
          riskLevel,
        });
      }
    }

    // Sort by highest similarity score first
    return results.sort((a, b) => b.similarityScore - a.similarityScore);
  }
}
