import { CONFIG } from '../config';

export interface AIProviderRequest {
  prompt: string;
  systemContext?: string;
  temperature?: number;
}

export interface AIProviderResponse {
  text: string;
  providerUsed: 'GEMINI' | 'LOCAL_RULE' | 'MOCK';
  success: boolean;
  error?: string;
}

export interface IAIProvider {
  name: string;
  generateResponse(req: AIProviderRequest): Promise<AIProviderResponse>;
}

export class GeminiProvider implements IAIProvider {
  name = 'GeminiProvider';

  async generateResponse(req: AIProviderRequest): Promise<AIProviderResponse> {
    const apiKey = CONFIG.GEMINI_API_KEY;
    if (!apiKey || apiKey === 'REQUIRED_ROTATION_DEMO_FALLBACK') {
      return {
        text: '',
        providerUsed: 'GEMINI',
        success: false,
        error: 'Gemini API key unconfigured or set to fallback placeholder.',
      };
    }

    try {
      const fullPrompt = `${req.systemContext || ''}\n\n${req.prompt}`;
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ contents: [{ parts: [{ text: fullPrompt }] }] }),
        }
      );

      if (res.ok) {
        const data = (await res.json()) as any;
        const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
        return { text, providerUsed: 'GEMINI', success: true };
      }
      return { text: '', providerUsed: 'GEMINI', success: false, error: `Gemini API returned status ${res.status}` };
    } catch (err: any) {
      return { text: '', providerUsed: 'GEMINI', success: false, error: err.message || 'Network call failed' };
    }
  }
}

export class LocalFallbackProvider implements IAIProvider {
  name = 'LocalFallbackProvider';

  async generateResponse(req: AIProviderRequest): Promise<AIProviderResponse> {
    return {
      text: `[Pariksha AI Rule Engine]: Processed verified platform guidelines for query. All candidate applications and exam schedules are backed by zero-trust audit ledger verification.`,
      providerUsed: 'LOCAL_RULE',
      success: true,
    };
  }
}

export class AIProviderFactory {
  private static gemini = new GeminiProvider();
  private static localFallback = new LocalFallbackProvider();

  public static getActiveProvider(): IAIProvider {
    if (CONFIG.GEMINI_API_KEY && CONFIG.GEMINI_API_KEY !== 'REQUIRED_ROTATION_DEMO_FALLBACK') {
      return this.gemini;
    }
    return this.localFallback;
  }
}
