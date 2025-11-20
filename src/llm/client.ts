export interface LLMMessage {
    role: 'system' | 'user' | 'assistant';
    content: string;
}

export interface LLMClient {
    /**
     * Send a chat completion request
     * @param messages - Array of messages
     * @returns The assistant's response content
     */
    chat(messages: LLMMessage[]): Promise<string>;
}

export interface EmbeddingClient {
    /**
     * Generate embedding vector for text
     * @param text - Input text
     * @returns Embedding vector (normalized)
     */
    embed(text: string): Promise<number[]>;
}
