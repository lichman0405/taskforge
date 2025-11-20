import { GoogleGenerativeAI } from '@google/generative-ai';
import type { LLMClient, LLMMessage, EmbeddingClient } from '../client.js';

export class GeminiLLMClient implements LLMClient {
    private client: GoogleGenerativeAI;
    private model: string;

    constructor(apiKey: string, model: string) {
        this.client = new GoogleGenerativeAI(apiKey);
        this.model = model;
    }

    async chat(messages: LLMMessage[]): Promise<string> {
        const genModel = this.client.getGenerativeModel({ model: this.model });

        // Convert messages to Gemini format
        const systemMessage = messages.find(m => m.role === 'system')?.content || '';
        const chatMessages = messages.filter(m => m.role !== 'system');

        // Build chat history (all but last message)
        const history = chatMessages.slice(0, -1).map(m => ({
            role: m.role === 'user' ? ('user' as const) : ('model' as const),
            parts: [{ text: m.content }],
        }));

        const lastMessage = chatMessages[chatMessages.length - 1];

        const chatOptions: any = { history };
        if (systemMessage) {
            chatOptions.systemInstruction = systemMessage;
        }

        const chat = genModel.startChat(chatOptions);

        const result = await chat.sendMessage(lastMessage?.content || '');
        return result.response.text();
    }
}

export class GeminiEmbeddingClient implements EmbeddingClient {
    private client: GoogleGenerativeAI;
    private model: string;

    constructor(apiKey: string, model: string) {
        this.client = new GoogleGenerativeAI(apiKey);
        this.model = model;
    }

    async embed(text: string): Promise<number[]> {
        const model = this.client.getGenerativeModel({ model: this.model });
        const result = await model.embedContent(text);
        return result.embedding.values || [];
    }
}
