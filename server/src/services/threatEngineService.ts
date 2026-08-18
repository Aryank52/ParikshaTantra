import { CONFIG } from '../config';

export interface RiskAnalysisResult {
  riskScore: number; // 0 to 100
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  reasons: string[];
  recommendedAction: 'NONE' | 'MONITOR' | 'LOCK_SESSION' | 'FREEZE_EXAM';
}


export class ThreatEngineService {
  /**
   * Analyzes an event or user access metrics for anomalous insider threats.
   */
  static analyzeUserBehavior(params: {
    actorRole: string;
    action: string;
    requestCountInLastMinute?: number;
    accessedQuestionIdsCount?: number;
    accessHour?: number;
    ipAddress?: string | string[];
    isOutsideAssignedCentre?: boolean;
    hasFailedMfa?: boolean;
  }): RiskAnalysisResult {
    let score = 0;
    const reasons: string[] = [];

    // Rule 1: Bulk question access detection
    if ((params.accessedQuestionIdsCount || 0) > 15) {
      score += 45;
      reasons.push(`Bulk question access anomaly: ${params.accessedQuestionIdsCount} questions accessed simultaneously.`);
    } else if ((params.accessedQuestionIdsCount || 0) > 5) {
      score += 20;
      reasons.push(`Elevated question retrieval volume: ${params.accessedQuestionIdsCount} questions accessed.`);
    }

    // Rule 2: High frequency / abnormal request rate
    if ((params.requestCountInLastMinute || 0) > 40) {
      score += 35;
      reasons.push(`Abnormal request frequency: ${params.requestCountInLastMinute} requests/minute detected.`);
    }

    // Rule 3: Off-hours access (e.g., between 11 PM and 5 AM local time)
    const hour = params.accessHour !== undefined ? params.accessHour : new Date().getHours();
    if (hour >= 23 || hour < 5) {
      score += 25;
      reasons.push(`Off-hours vault access detected at ${hour}:00 hrs.`);
    }

    // Rule 4: Access outside assigned examination / centre boundaries
    if (params.isOutsideAssignedCentre) {
      score += 40;
      reasons.push('Access attempt from unauthorized network segment or outside assigned centre bounds.');
    }

    // Rule 5: Failed MFA or suspicious privilege escalation attempt
    if (params.hasFailedMfa) {
      score += 30;
      reasons.push('Multiple failed MFA / privilege escalation attempts recorded.');
    }

    // Rule 6: Sensitive actions by candidate or non-vault role
    if (params.actorRole === 'CANDIDATE' && params.action.includes('QUESTION_VAULT')) {
      score = 100;
      reasons.push('CRITICAL: Candidate role attempting direct Question Vault access.');
    }

    // Cap score at 100
    score = Math.min(score, 100);

    let riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' = 'LOW';
    let recommendedAction: 'NONE' | 'MONITOR' | 'LOCK_SESSION' | 'FREEZE_EXAM' = 'NONE';

    if (score >= 85) {
      riskLevel = 'CRITICAL';
      recommendedAction = 'FREEZE_EXAM';
    } else if (score >= 60) {
      riskLevel = 'HIGH';
      recommendedAction = 'LOCK_SESSION';
    } else if (score >= 35) {
      riskLevel = 'MEDIUM';
      recommendedAction = 'MONITOR';
    }

    if (reasons.length === 0) {
      reasons.push('Behavior matches standard baseline patterns.');
    }

    return {
      riskScore: score,
      riskLevel,
      reasons,
      recommendedAction,
    };
  }

  /**
   * AI-Enriched Threat Analysis using Google Gemini API.
   */
  static async analyzeBehaviorWithAI(params: Parameters<typeof ThreatEngineService.analyzeUserBehavior>[0]): Promise<RiskAnalysisResult> {
    const baseResult = this.analyzeUserBehavior(params);
    if (CONFIG.GEMINI_API_KEY) {
      try {
        const prompt = `You are ParikshaTantra SOC Threat Engine AI Advisor.
Analyze this user security access profile:
Actor Role: ${params.actorRole}
Action: ${params.action}
Accessed Questions Count: ${params.accessedQuestionIdsCount || 0}
Request Count / Min: ${params.requestCountInLastMinute || 0}
Access Hour: ${params.accessHour}
Outside Assigned Centre: ${params.isOutsideAssignedCentre ? 'YES' : 'NO'}

Rule-based Risk Score: ${baseResult.riskScore}/100 (${baseResult.riskLevel})

Provide a 1-sentence AI executive threat summary for the security command dashboard.
Respond ONLY with valid JSON:
{
  "aiSummary": "Executive AI threat evaluation."
}`;

        const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${CONFIG.GEMINI_API_KEY}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
        });

        if (res.ok) {
          const data = (await res.json()) as any;
          const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
          const match = text.match(/\{[\s\S]*\}/);
          if (match) {
            const parsed = JSON.parse(match[0]);
            if (parsed.aiSummary) {
              baseResult.reasons.unshift(`AI SOC Analysis: ${parsed.aiSummary}`);
            }
          }
        }
      } catch (err) {
        // Fallback silently to rule-based result
      }
    }
    return baseResult;
  }
}

