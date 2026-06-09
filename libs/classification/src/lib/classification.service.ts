import { RulesEngine } from './rules.engine';
import { ClassificationResult } from './classification.types';

const RULES_CONFIDENCE_THRESHOLD = 0.75;

export class ClassificationService {
    constructor(private readonly rulesEngine: RulesEngine) {}

    async classify(subject: string, body: string): Promise<ClassificationResult> {
        const rulesResult = this.rulesEngine.classify(subject, body);
        if (rulesResult && rulesResult.confidence >= RULES_CONFIDENCE_THRESHOLD) {
            return rulesResult;
        }
        return { type: 'unknown', confidence: 0, summary: 'Non classifié par règles', next_action: 'none' };
    }
}
