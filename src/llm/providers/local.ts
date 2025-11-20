import { pipeline } from '@xenova/transformers';
import type { EmbeddingClient } from '../client.js';

/**
 * Local Embedding Client using Transformers.js
 * Runs models locally without requiring API calls
 */
export class LocalEmbeddingClient implements EmbeddingClient {
    private embedder: any;
    private model: string;
    private initialized: boolean = false;

    constructor(model: string = 'Xenova/all-MiniLM-L6-v2') {
        this.model = model;
    }

    private async initialize() {
        if (this.initialized) return;

        console.log(`Loading local embedding model: ${this.model}...`);
        this.embedder = await pipeline('feature-extraction', this.model);
        this.initialized = true;
        console.log('Model loaded successfully!');
    }

    async embed(text: string): Promise<number[]> {
        await this.initialize();

        // Generate embedding
        const output = await this.embedder(text, { pooling: 'mean', normalize: true });

        // Convert to regular array
        return Array.from(output.data);
    }
}
