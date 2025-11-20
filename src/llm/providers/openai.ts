import OpenAI from 'openai';
import type { LLMClient, LLMMessage, EmbeddingClient } from '../client.js';

export class OpenAILLMClient implements LLMClient {
    private client: OpenAI;
    private model: string;

    constructor(apiKey: string, model: string, baseURL?: string) {
        this.client = new OpenAI({
            apiKey,
            baseURL,
        });
        this.model = model;
    }

    async chat(messages: LLMMessage[]): Promise<string> {
        const response = await this.client.chat.completions.create({
            model: this.model,
            messages: messages.map(m => ({
                role: m.role,
                content: m.content,
            })),
        });

        return response.choices[0]?.message?.content || '';
    }
}

export class OpenAIEmbeddingClient implements EmbeddingClient {
    private client: OpenAI;
    private model: string;

    constructor(apiKey: string, model: string, baseURL?: string) {
        this.client = new OpenAI({
            apiKey,
            baseURL,
        });
        this.model = model;
    }

    async embed(text: string): Promise<number[]> {
        const response = await this.client.embeddings.create({
            model: this.model,
            input: text,
        });

        return response.data[0]?.embedding || [];
    }
}
