import { Ollama } from 'ollama';
import type { LLMClient, LLMMessage } from '../client.js';

export class OllamaLLMClient implements LLMClient {
    private client: Ollama;
    private model: string;

    constructor(baseUrl: string, model: string) {
        this.client = new Ollama({ host: baseUrl });
        this.model = model;
    }

    async chat(messages: LLMMessage[]): Promise<string> {
        const response = await this.client.chat({
            model: this.model,
            messages: messages.map(m => ({
                role: m.role,
                content: m.content,
            })),
        });

        return response.message.content;
    }
}
