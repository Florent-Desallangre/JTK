export interface OllamaConfig {
    baseUrl: string;
    model: string;
}

export function getOllamaConfig(): OllamaConfig {
    return {
        baseUrl: process.env['OLLAMA_BASE_URL'] ?? 'http://localhost:11434',
        model: process.env['OLLAMA_MODEL'] ?? 'mistral',
    };
}
