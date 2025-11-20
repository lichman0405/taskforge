// Environment variables should be loaded by the application, not the library

export type LLMProvider = 'openai' | 'anthropic' | 'gemini' | 'ollama' | 'custom';
export type EmbeddingProvider = 'openai' | 'gemini' | 'local';

export interface LLMConfig {
    provider: LLMProvider;
    apiKey: string;
    baseUrl?: string;
    model: string;
}

export interface EmbeddingConfig {
    provider: EmbeddingProvider;
    apiKey: string;
    baseUrl?: string;
    model: string;
}

function getEnv(key: string, required = true): string | undefined {
    const value = process.env[key];
    if (required && !value) {
        throw new Error(`Environment variable ${key} is required but not set`);
    }
    return value;
}

export function getLLMConfig(): LLMConfig {
    const provider = (getEnv('LLM_PROVIDER', false) || 'gemini') as LLMProvider;

    switch (provider) {
        case 'openai': {
            const baseUrl = getEnv('OPENAI_API_KEY', false);
            return {
                provider,
                apiKey: getEnv('OPENAI_API_KEY')!,
                ...(baseUrl ? { baseUrl } : {}),
                model: getEnv('OPENAI_MODEL', false) || 'gpt-4o-mini',
            };
        }
        case 'anthropic':
            return {
                provider,
                apiKey: getEnv('ANTHROPIC_API_KEY')!,
                model: getEnv('ANTHROPIC_MODEL', false) || 'claude-3-5-sonnet-20241022',
            };
        case 'gemini':
            return {
                provider,
                apiKey: getEnv('GEMINI_API_KEY')!,
                model: getEnv('GEMINI_MODEL', false) || 'gemini-2.0-flash-exp',
            };
        case 'ollama': {
            const baseUrl = getEnv('OLLAMA_BASE_URL', false) || 'http://localhost:11434';
            return {
                provider,
                apiKey: '', // Ollama doesn't require API key
                baseUrl,
                model: getEnv('OLLAMA_MODEL', false) || 'llama3.2',
            };
        }
        case 'custom':
            return {
                provider,
                apiKey: getEnv('CUSTOM_API_KEY')!,
                baseUrl: getEnv('CUSTOM_BASE_URL')!,
                model: getEnv('CUSTOM_MODEL')!,
            };
        default:
            throw new Error(`Unknown LLM provider: ${provider}`);
    }
}

export function getEmbeddingConfig(): EmbeddingConfig {
    const provider = (getEnv('EMBEDDING_PROVIDER', false) || 'openai') as EmbeddingProvider;

    switch (provider) {
        case 'openai': {
            const baseUrl = getEnv('OPENAI_BASE_URL', false);
            return {
                provider,
                apiKey: getEnv('OPENAI_API_KEY')!,
                ...(baseUrl ? { baseUrl } : {}),
                model: getEnv('EMBEDDING_MODEL', false) || 'text-embedding-3-small',
            };
        }
        case 'gemini':
            return {
                provider,
                apiKey: getEnv('GEMINI_API_KEY')!,
                model: getEnv('EMBEDDING_MODEL', false) || 'text-embedding-004',
            };
        case 'local':
            return {
                provider,
                apiKey: '', // Not needed for local
                model: getEnv('LOCAL_EMBEDDING_MODEL', false) || 'Xenova/all-MiniLM-L6-v2',
            };
        default:
            throw new Error(`Unknown embedding provider: ${provider}`);
    }
}
