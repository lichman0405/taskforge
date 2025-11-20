import Anthropic from '@anthropic-ai/sdk';
import type { LLMClient, LLMMessage } from '../client.js';

export class AnthropicLLMClient implements LLMClient {
    private client: Anthropic;
    private model: string;

    constructor(apiKey: string, model: string) {
        this.client = new Anthropic({
            apiKey,
        });
        this.model = model;
    }

    async chat(messages: LLMMessage[]): Promise<string> {
        // Anthropic requires system messages to be separate
        const systemMessages = messages.filter(m => m.role === 'system');
        const userMessages = messages.filter(m => m.role !== 'system');

        const response = await this.client.messages.create({
            model: this.model,
            max_tokens: 4096,
            system: systemMessages.map(m => m.content).join('\n'),
            messages: userMessages.map(m => ({
                role: m.role as 'user' | 'assistant',
                content: m.content,
            })),
        });

        const content = response.content[0];
        return content?.type === 'text' ? content.text : '';
    }
}
