/**
 * Example 03: Custom Weights
 * 
 * 演示如何自定义评分指标的权重
 * 比较不同权重配置对 TDQ 分数的影响
 */

import { computeTDQ, DEFAULT_WEIGHTS } from '../../dist/metrics/tdq.js';
import { generateTaskTree } from '../../dist/service/taskService.js';
import { createLLMClient, createEmbeddingClient } from '../../dist/llm/factory.js';
import { getLLMConfig, getEmbeddingConfig } from '../../dist/core/config.js';

console.log('=== Example 03: Custom Weights ===\n');

// 不同的权重配置
const weightConfigs = {
    default: DEFAULT_WEIGHTS,

    // 强调可执行性
    executability_focused: {
        acyclicity: 0.05,
        hierarchy: 0.10,
        balance: 0.05,
        granularity: 0.15,
        redundancy: 0.05,
        executability: 0.60,
    },

    // 强调结构
    structure_focused: {
        acyclicity: 0.20,
        hierarchy: 0.30,
        balance: 0.20,
        granularity: 0.10,
        redundancy: 0.10,
        executability: 0.10,
    },

    // 平衡
    balanced: {
        acyclicity: 0.15,
        hierarchy: 0.15,
        balance: 0.15,
        granularity: 0.20,
        redundancy: 0.15,
        executability: 0.20,
    },
};

const userInput = '创建一个简单的待办事项 (Todo) Web 应用，支持添加、编辑、删除和完成标记功能';

async function main() {
    try {
        // 初始化客户端
        const llmConfig = getLLMConfig();
        const embeddingConfig = getEmbeddingConfig();

        console.log(`LLM Provider: ${llmConfig.provider}`);
        console.log(`Embedding Provider: ${embeddingConfig.provider}\n`);

        const llmClient = createLLMClient(llmConfig);
        const embeddingClient = createEmbeddingClient(embeddingConfig);

        // 生成任务树
        console.log('📝 生成任务树...\n');
        const tree = await generateTaskTree(userInput, llmClient);
        console.log(`✅ 已生成任务树 (${tree.children.length} 个子任务)\n`);

        // 使用不同权重评估
        console.log('========================================');
        console.log('使用不同权重配置评估');
        console.log('========================================\n');

        for (const [name, weights] of Object.entries(weightConfigs)) {
            console.log(`▶ ${name}:`);
            console.log(`  权重: A=${weights.acyclicity}, H=${weights.hierarchy}, B=${weights.balance},`);
            console.log(`        G=${weights.granularity}, R=${weights.redundancy}, E=${weights.executability}`);

            const tdq = await computeTDQ(tree, llmClient, embeddingClient, weights);

            console.log(`  TDQ 得分: ${tdq.score.toFixed(3)}`);
            console.log(`  问题数: ${tdq.issues.length}\n`);
        }

        console.log('💡 提示: 不同的权重配置适用于不同的场景');
        console.log('  - executability_focused: 适合需要立即执行的任务');
        console.log('  - structure_focused: 适合长期规划和复杂项目');
        console.log('  - balanced: 适合大多数场景');

    } catch (error) {
        console.error('❌ 错误:', error);
    }
}

main();
