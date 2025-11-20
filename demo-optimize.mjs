import { optimizeTaskDecomposition } from './dist/service/taskService.js';
import { createLLMClient, createEmbeddingClient } from './dist/llm/factory.js';
import { getLLMConfig, getEmbeddingConfig } from './dist/core/config.js';
import { exportToMarkdown, saveTaskTree } from './dist/core/export.js';

console.log('=== TaskForce Iteration 3 - Auto-Optimization Demo ===\n');

const USER_INPUT = `
创建一个在线教育平台，支持视频课程、在线测验和学生管理功能。
需要包含前端、后端和数据库设计。
`;

async function runDemo() {
    try {
        // Initialize clients
        const llmConfig = getLLMConfig();
        const embeddingConfig = getEmbeddingConfig();

        console.log(`LLM Provider: ${llmConfig.provider} (${llmConfig.model})`);
        console.log(`Embedding Provider: ${embeddingConfig.provider} (${embeddingConfig.model})\n`);

        const llmClient = createLLMClient(llmConfig);
        const embeddingClient = createEmbeddingClient(embeddingConfig);

        // Run optimization
        const result = await optimizeTaskDecomposition(
            USER_INPUT,
            llmClient,
            embeddingClient,
            {
                maxIterations: 3,
                targetTDQ: 0.75,
                verbose: true,
            }
        );

        console.log('\n========================================');
        console.log('🎉 Optimization Complete!');
        console.log('========================================\n');

        console.log(`Final TDQ: ${result.finalTDQ.score.toFixed(3)}`);
        console.log(`Iterations: ${result.iterations}\n`);

        console.log('Optimization History:');
        result.history.forEach(h => {
            console.log(`  Iteration ${h.iteration}: TDQ = ${h.tdq.toFixed(3)} (${h.issues.length} issues)`);
        });

        // Export results
        console.log('\n📄 Exporting results...');

        await saveTaskTree(
            result.finalTree,
            'output_task_tree.json',
            'json'
        );
        console.log('✅ Saved to: output_task_tree.json');

        await saveTaskTree(
            result.finalTree,
            'output_task_tree.md',
            'markdown',
            result.finalTDQ
        );
        console.log('✅ Saved to: output_task_tree.md');

        console.log('\n✨ Done!');

    } catch (error) {
        console.error('❌ Error:', error);
        console.log('\nPlease ensure:');
        console.log('1. Your .env file is configured correctly');
        console.log('2. You have valid API keys');
    }
}

runDemo();
