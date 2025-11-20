import type { LLMConfig, EmbeddingConfig } from '../core/config.js';
import type { LLMClient, EmbeddingClient } from './client.js';
import { OpenAILLMClient, OpenAIEmbeddingClient } from './providers/openai.js';
import { AnthropicLLMClient } from './providers/anthropic.js';
import { GeminiLLMClient, GeminiEmbeddingClient } from './providers/gemini.js';
import { OllamaLLMClient } from './providers/ollama.js';
import { LocalEmbeddingClient } from './providers/local.js';

export function createLLMClient(config: LLMConfig): LLMClient {
    switch (config.provider) {
        case 'openai':
        case 'custom': // Custom providers use OpenAI-compatible API
            return new OpenAILLMClient(config.apiKey, config.model, config.baseUrl);

        case 'anthropic':
            return new AnthropicLLMClient(config.apiKey, config.model);

        case 'gemini':
            return new GeminiLLMClient(config.apiKey, config.model);

        case 'ollama':
            return new OllamaLLMClient(config.baseUrl || 'http://localhost:11434', config.model);

        default:
            throw new Error(`Unsupported LLM provider: ${config.provider}`);
    }
}

export function createEmbeddingClient(config: EmbeddingConfig): EmbeddingClient {
    switch (config.provider) {
        case 'openai':
            return new OpenAIEmbeddingClient(config.apiKey, config.model, config.baseUrl);

        case 'gemini':
            return new GeminiEmbeddingClient(config.apiKey, config.model);

        case 'local':
            return new LocalEmbeddingClient(config.model);

        default:
            throw new Error(`Unsupported embedding provider: ${config.provider}`);
    }
}
