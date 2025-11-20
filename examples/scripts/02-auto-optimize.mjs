/**
 * Example 02: Auto-Optimize
 * 
 * 演示自动优化功能
 * 从文本输入生成任务树，并自动迭代优化
 */

// 加载环境变量（从项目根目录）
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, '../../');
dotenv.config({ path: join(projectRoot, '.env') });

import { optimizeTaskDecomposition } from '../../dist/service/taskService.js';
import { createLLMClient, createEmbeddingClient } from '../../dist/llm/factory.js';
import { getLLMConfig, getEmbeddingConfig } from '../../dist/core/config.js';
import { saveTaskTree } from '../../dist/core/export.js';
import fs from 'fs/promises';

console.log('=== Example 02: Auto-Optimize ===\n');

// 从文件读取任务描述
const taskFile = process.argv[2] || '../tasks/web-app.txt';

async function main() {
    try {
        // 读取任务描述
        const userInput = await fs.readFile(taskFile, 'utf-8');
        console.log('📄 任务描述:');
        console.log('---');
        console.log(userInput.trim());
        console.log('---\n');

        // 初始化客户端
        const llmConfig = getLLMConfig();
        const embeddingConfig = getEmbeddingConfig();

        console.log(`LLM Provider: ${llmConfig.provider} (${llmConfig.model})`);
        console.log(`Embedding Provider: ${embeddingConfig.provider}\n`);

        const llmClient = createLLMClient(llmConfig);
        const embeddingClient = createEmbeddingClient(embeddingConfig);

        // 执行自动优化
        console.log('🚀 开始自动优化...\n');

        const result = await optimizeTaskDecomposition(
            userInput,
            llmClient,
            embeddingClient,
            {
                maxIterations: 3,
                targetTDQ: 0.75,
                verbose: true
            }
        );

        // 输出结果
        console.log('\n========================================');
        console.log('🎉 优化完成!');
        console.log('========================================\n');

        console.log(`最终 TDQ: ${result.finalTDQ.score.toFixed(3)}`);
        console.log(`迭代次数: ${result.iterations}\n`);

        console.log('优化历史：');
        result.history.forEach(h => {
            const status = h.tdq >= 0.75 ? '✅' : h.tdq >= 0.6 ? '🟡' : '🔴';
            console.log(`  第 ${h.iteration} 轮: TDQ = ${h.tdq.toFixed(3)} ${status}`);
        });

        // 保存结果
        console.log('\n📄 保存结果...');
        await saveTaskTree(result.finalTree, 'output_example02.json', 'json');
        console.log('✅ JSON: output_example02.json');

        await saveTaskTree(result.finalTree, 'output_example02.md', 'markdown', result.finalTDQ);
        console.log('✅ Markdown: output_example02.md');

    } catch (error) {
        console.error('❌ 错误:', error);
    }
}

main();
