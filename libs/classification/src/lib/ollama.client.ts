import { ClassificationResult, ClassificationSchema, FollowupEmailResult, FollowupEmailSchema } from './classification.types';
import { OllamaConfig } from './ollama.config';

const CLASSIFICATION_PROMPT = `Analyze this recruiter email and respond ONLY with valid JSON, no other text:
{"type":"positive|negative|neutral|unknown","confidence":0.0-1.0,"summary":"string","next_action":"none|followup|interview|reject"}

Email subject: {{subject}}
Email body: {{body}}`;

export class OllamaClient {
    constructor(private readonly config: OllamaConfig) {}

    async classify(subject: string, body: string): Promise<ClassificationResult> {
        const prompt = CLASSIFICATION_PROMPT.replace('{{subject}}', subject).replace('{{body}}', body.slice(0, 2000));
        return this.generateJson(prompt, ClassificationSchema, this.fallbackClassification());
    }

    async generateFollowupEmail(context: { title: string; company?: string }): Promise<FollowupEmailResult> {
        const prompt = `Generate a polite French follow-up email for a job application. Respond ONLY with JSON: {"subject":"string","body":"string"}
Position: ${context.title}
Company: ${context.company ?? 'unknown'}`;
        return this.generateJson(prompt, FollowupEmailSchema, { subject: 'Relance candidature', body: 'Bonjour,\n\nJe me permets de relancer ma candidature.\n\nCordialement,' });
    }

    private async generateJson<T>(prompt: string, schema: { parse: (data: unknown) => T }, fallback: T): Promise<T> {
        for (let attempt = 0; attempt < 3; attempt++) {
            try {
                const response = await fetch(`${this.config.baseUrl}/api/generate`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        model: this.config.model,
                        prompt,
                        stream: false,
                        format: 'json',
                    }),
                });

                if (!response.ok) throw new Error(`Ollama error: ${response.status}`);

                const data = (await response.json()) as { response: string };
                const parsed = JSON.parse(this.extractJson(data.response));
                return schema.parse(parsed);
            } catch {
                // retry
            }
        }
        return fallback;
    }

    private extractJson(text: string): string {
        const match = text.match(/\{[\s\S]*\}/);
        return match?.[0] ?? text;
    }

    private fallbackClassification(): ClassificationResult {
        return { type: 'unknown', confidence: 0, summary: 'Classification échouée', next_action: 'none' };
    }
}
