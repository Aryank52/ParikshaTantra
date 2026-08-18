export interface ExamPolicyConfig {
  cameraRequired: boolean;
  microphoneRequired: boolean;
  geolocationRequired: boolean;
  fullscreenRequired: boolean;
  calculatorAllowed: boolean;
  roughSheetAllowed: boolean;
  languageSwitchingAllowed: boolean;
  sectionLockingEnabled: boolean;
  questionRandomization: boolean;
  optionRandomization: boolean;
  lateEntryWindowMinutes: number;
  earlySubmissionAllowed: boolean;
  negativeMarkingRatio: number;
  autoSaveIntervalSeconds: number;
  paperVariants: string[]; // e.g. ['SET_A', 'SET_B', 'SET_C', 'SET_D']
  identityVerificationLevel: 'STANDARD' | 'BIOMETRIC_STQC' | 'DIGILOCKER_EKYC';
  incidentAutoFreezeThreshold: number; // e.g. Risk score > 85
}

export const DEFAULT_EXAM_POLICY: ExamPolicyConfig = {
  cameraRequired: true,
  microphoneRequired: false,
  geolocationRequired: false,
  fullscreenRequired: true,
  calculatorAllowed: false,
  roughSheetAllowed: true,
  languageSwitchingAllowed: true,
  sectionLockingEnabled: false,
  questionRandomization: true,
  optionRandomization: true,
  lateEntryWindowMinutes: 15,
  earlySubmissionAllowed: false,
  negativeMarkingRatio: 0.25,
  autoSaveIntervalSeconds: 15,
  paperVariants: ['SET_A', 'SET_B', 'SET_C', 'SET_D'],
  identityVerificationLevel: 'STANDARD',
  incidentAutoFreezeThreshold: 85,
};

export class ExamPolicyService {
  /**
   * Resolves policy for an examination.
   */
  static getPolicyForExam(examId: string, customPolicyJson?: string | null): ExamPolicyConfig {
    if (!customPolicyJson) return DEFAULT_EXAM_POLICY;
    try {
      const parsed = JSON.parse(customPolicyJson);
      return { ...DEFAULT_EXAM_POLICY, ...parsed };
    } catch {
      return DEFAULT_EXAM_POLICY;
    }
  }

  /**
   * Computes paper variant (Set A / B / C / D) deterministically based on candidate roll number & session ID.
   */
  static computePaperVariant(candidateCode: string, sessionId: string, variants = ['SET_A', 'SET_B', 'SET_C', 'SET_D']): string {
    let hash = 0;
    const combined = `${candidateCode}:${sessionId}`;
    for (let i = 0; i < combined.length; i++) {
      hash = (hash << 5) - hash + combined.charCodeAt(i);
      hash |= 0;
    }
    const idx = Math.abs(hash) % variants.length;
    return variants[idx];
  }
}
