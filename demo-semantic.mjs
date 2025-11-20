import { computeRedundancy, computeGranularity, computeExecutability } from './dist/metrics/semantic.js';
import { createLLMClient, createEmbeddingClient } from './dist/llm/factory.js';
import { getLLMConfig, getEmbeddingConfig } from './dist/core/config.js';

console.log('=== TaskForce Iteration 2 - Semantic Metrics Demo ===\n');

// Sample task tree with intentional issues
const testTree = {
    id: 'root',
    title: 'Build E-commerce Website',
    children: [
        {
            id: 't1',
            title: 'User Authentication',
            description: 'Implement login and registration',
            children: [
                { id: 't1_1', title: 'Implement login', description: 'Create login form and API endpoint', children: [] },
                { id: 't1_2', title: 'Implement user login', description: 'Build authentication system', children: [] }, // Redundant!
            ]
        },
        {
            id: 't2',
            title: 'Product Catalog',
            children: [
                { id: 't2_1', title: 'Build the entire product management system', children: [] }, // Too broad!
                { id: 't2_2', title: 'Add product search', description: 'Implement search functionality with filters', children: [] },
            ]
        },
        {
            id: 't3',
            title: 'Payment Integration',
            children: [
                { id: 't3_1', title: 'Integrate Stripe payment gateway', description: 'Add Stripe SDK and create payment form', children: [] },
                { id: 't3_2', title: 'Do something', children: [] }, // Vague!
            ]
        }
    ]
};

async function runDemo() {
    try {
        // Initialize clients
        const llmConfig = getLLMConfig();
        const embeddingConfig = getEmbeddingConfig();

        console.log(`Using LLM Provider: ${llmConfig.provider} (${llmConfig.model})`);
        console.log(`Using Embedding Provider: ${embeddingConfig.provider} (${embeddingConfig.model})\n`);

        const llmClient = createLLMClient(llmConfig);
        const embeddingClient = createEmbeddingClient(embeddingConfig);

        // Test Redundancy
        console.log('--- Testing Redundancy ---');
        const redundancy = await computeRedundancy(testTree, embeddingClient, 0.8);
        console.log('Result:', redundancy);
        console.log('');

        // Test Granularity
        console.log('--- Testing Granularity ---');
        const granularity = await computeGranularity(testTree, llmClient);
        console.log('Result:', granularity);
        console.log('');

        // Test Executability
        console.log('--- Testing Executability ---');
        const executability = await computeExecutability(testTree, llmClient);
        console.log('Result:', executability);
        console.log('');

        console.log('=== All semantic metrics implemented and working! ===');
    } catch (error) {
        console.error('Error running demo:', error);
        console.log('\nPlease ensure you have set up your .env file with valid API keys.');
        console.log('Copy .env.example to .env and fill in your keys.');
    }
}

runDemo();
