import { ClassificationResult } from './classification.types';

const REJECT_PATTERNS = [/refus/i, /unfortunately/i, /ne donnons pas suite/i, /not selected/i, /rejected/i];
const INTERVIEW_PATTERNS = [/entretien/i, /interview/i, /convier/i, /schedule a call/i];
const OFFER_PATTERNS = [/offre d.?emploi/i, /job offer/i, /nous sommes ravis de vous proposer/i];
const POSITIVE_PATTERNS = [/suite favorable/i, /moving forward/i, /pleased to/i];

export class RulesEngine {
    classify(subject: string, body: string): ClassificationResult | null {
        const text = `${subject} ${body}`;

        if (OFFER_PATTERNS.some((p) => p.test(text))) {
            return { type: 'positive', confidence: 0.9, summary: 'Offre détectée', next_action: 'none' };
        }
        if (REJECT_PATTERNS.some((p) => p.test(text))) {
            return { type: 'negative', confidence: 0.9, summary: 'Refus détecté', next_action: 'reject' };
        }
        if (INTERVIEW_PATTERNS.some((p) => p.test(text))) {
            return { type: 'positive', confidence: 0.85, summary: 'Entretien proposé', next_action: 'interview' };
        }
        if (POSITIVE_PATTERNS.some((p) => p.test(text))) {
            return { type: 'positive', confidence: 0.75, summary: 'Réponse positive', next_action: 'followup' };
        }

        return null;
    }
}
