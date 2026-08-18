import { CONFIG } from '../config';

export interface MatchResult {
  questionId: string;
  questionCode: string;
  subject: string;
  similarityScore: number; // 0.0 to 100.0
  matchedSnippet: string;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  aiExplanation?: string;
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

  /**
   * Deep Gemini AI semantic leak analysis evaluating paraphrasing and cross-lingual conceptual matches.
   */
  static async analyzeLeakAsync(
    evidenceText: string,
    vaultQuestions: Array<{ id: string; questionCode: string; subject: string; plainTextContent: string }>
  ): Promise<{ matches: MatchResult[]; aiAnalysisReport?: string }> {
    const baseMatches = this.analyzeLeak(evidenceText, vaultQuestions);

    if (CONFIG.GEMINI_API_KEY && vaultQuestions.length > 0) {
      try {
        const topCandidates = vaultQuestions.slice(0, 10);
        const prompt = `You are ParikshaTantra AI Leak Detection Engine for Indian National Examinations.
Analyze the following leaked evidence snippet against candidate question vault items for semantic similarity, paraphrasing, conceptual translation, or direct paper leak.

Leaked Evidence Text: "${evidenceText}"

Vault Questions:
${topCandidates.map((q, idx) => `[${idx + 1}] Code: ${q.questionCode}, Subject: ${q.subject}, Content: "${q.plainTextContent}"`).join('\n')}

Respond ONLY with valid JSON in the following schema:
{
  "topMatchCode": "QUESTION_CODE_OR_NONE",
  "similarityScore": 85,
  "riskLevel": "CRITICAL",
  "aiExplanation": "Detailed explanation of semantic similarity, paraphrased concepts, or keyword matches."
}`;

        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${CONFIG.GEMINI_API_KEY}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
          }),
        });

        if (response.ok) {
          const data = (await response.json()) as any;
          const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
          const jsonMatch = text.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            const parsed = JSON.parse(jsonMatch[0]);
            if (parsed.topMatchCode && parsed.topMatchCode !== 'NONE') {
              const matchedQ = vaultQuestions.find((q) => q.questionCode === parsed.topMatchCode);
              if (matchedQ) {
                const aiMatch: MatchResult = {
                  questionId: matchedQ.id,
                  questionCode: matchedQ.questionCode,
                  subject: matchedQ.subject,
                  similarityScore: Math.max(parsed.similarityScore || 50, baseMatches[0]?.similarityScore || 0),
                  matchedSnippet: matchedQ.plainTextContent.substring(0, 120) + '...',
                  riskLevel: parsed.riskLevel || 'HIGH',
                  aiExplanation: parsed.aiExplanation || 'Gemini AI semantic match confirmed.',
                };

                const existingIdx = baseMatches.findIndex((m) => m.questionCode === matchedQ.questionCode);
                if (existingIdx >= 0) {
                  baseMatches[existingIdx] = { ...baseMatches[existingIdx], ...aiMatch };
                } else {
                  baseMatches.unshift(aiMatch);
                }
              }
            }
            return { matches: baseMatches, aiAnalysisReport: parsed.aiExplanation };
          }
        }
      } catch (err) {
        console.warn('Gemini AI Leak Engine fallback to rule-based similarity:', err);
      }
    }

    return { matches: baseMatches };
  }
}

