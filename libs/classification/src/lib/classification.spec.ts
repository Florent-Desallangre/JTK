import { RulesEngine } from './rules.engine';
import { ClassificationService } from './classification.service';

describe('RulesEngine', () => {
    const engine = new RulesEngine();

    it('classifies rejection emails', () => {
        const result = engine.classify('Candidature refusée', 'Nous ne donnons pas suite à votre candidature');
        expect(result?.type).toBe('negative');
        expect(result?.next_action).toBe('reject');
    });

    it('classifies interview invitation', () => {
        const result = engine.classify('Invitation entretien', 'Nous avons le plaisir de vous convier à un entretien');
        expect(result?.type).toBe('positive');
        expect(result?.next_action).toBe('interview');
    });

    it('classifies job offer', () => {
        const result = engine.classify('Offre d emploi', 'Nous sommes ravis de vous proposer une offre');
        expect(result?.next_action).toBe('none');
    });
});

describe('ClassificationService', () => {
    const service = new ClassificationService(new RulesEngine());

    it('uses rules for high confidence emails', async () => {
        const result = await service.classify('Refus', 'unfortunately we will not move forward');
        expect(result.type).toBe('negative');
    });

    it('returns unknown for ambiguous emails', async () => {
        const result = await service.classify('Hello', 'Just checking in');
        expect(result.type).toBe('unknown');
    });
});
