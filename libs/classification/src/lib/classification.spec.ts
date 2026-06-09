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
    const ollamaClient = { classify: jest.fn() } as unknown as import('./ollama.client').OllamaClient;
    const service = new ClassificationService(new RulesEngine(), ollamaClient);

    it('uses rules for high confidence emails', async () => {
        const result = await service.classify('Refus', 'unfortunately we will not move forward');
        expect(result.type).toBe('negative');
        expect(ollamaClient.classify).not.toHaveBeenCalled();
    });

    it('falls back to ollama for ambiguous emails', async () => {
        (ollamaClient.classify as jest.Mock).mockResolvedValue({
            type: 'neutral',
            confidence: 0.5,
            summary: 'test',
            next_action: 'none',
        });
        const result = await service.classify('Hello', 'Just checking in');
        expect(result.type).toBe('neutral');
        expect(ollamaClient.classify).toHaveBeenCalled();
    });
});

describe('OllamaClient', () => {
    it('generates followup email json', async () => {
        global.fetch = jest.fn().mockResolvedValue({
            ok: true,
            json: async () => ({
                response: '{"subject":"Relance","body":"Bonjour, je relance ma candidature."}',
            }),
        }) as never;

        const { OllamaClient } = await import('./ollama.client');
        const client = new OllamaClient({ baseUrl: 'http://localhost:11434', model: 'mistral' });
        const result = await client.generateFollowupEmail({ title: 'Dev', company: 'Acme' });
        expect(result.subject).toBe('Relance');
    });

    it('parses json from response', async () => {
        global.fetch = jest.fn().mockResolvedValue({
            ok: true,
            json: async () => ({
                response: '{"type":"neutral","confidence":0.5,"summary":"test","next_action":"none"}',
            }),
        }) as never;

        const { OllamaClient } = await import('./ollama.client');
        const client = new OllamaClient({ baseUrl: 'http://localhost:11434', model: 'mistral' });
        const result = await client.classify('Test', 'Body');
        expect(result.type).toBe('neutral');
    });
});
