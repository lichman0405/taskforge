/**
 * Example 04: Batch Process
 * 
 * 演示如何批量处理多个任务
 * 对比不同任务的 TDQ 得分
 */

import { optimizeTaskDecomposition } from '../../dist/service/taskService.js';
import { createLLMClient, createEmbeddingClient } from '../../dist/llm/factory.js';
import { getLLMConfig, getEmbeddingConfig } from '../../dist/core/config.js';
import fs from 'fs/promises';
import path from 'path';

console.log('=== Example 04: Batch Process ===\n');

const tasksDir = '../tasks';

async function main() {
    try {
        // 初始化客户端
        const llmConfig = getLLMConfig();
        const embeddingConfig = getEmbeddingConfig();

        console.log(`LLM Provider: ${llmConfig.provider}`);
        console.log(`Embedding Provider: ${embeddingConfig.provider}\n`);

        const llmClient = createLLMClient(llmConfig);
        const embeddingClient = createEmbeddingClient(embeddingConfig);

        // 读取所有任务文件
        const files = await fs.readdir(tasksDir);
        const txtFiles = files.filter(f => f.endsWith('.txt'));

        console.log(`📁 找到 ${txtFiles.length} 个任务文件\n`);

        const results = [];

        // 批量处理
        for (let i = 0; i < txtFiles.length; i++) {
            const file = txtFiles[i];
            const filePath = path.join(tasksDir, file);
            const taskName = file.replace('.txt', '');

            console.log(`\n[${i + 1}/${txtFiles.length}] 处理: ${taskName}`);
            console.log('─'.repeat(50));

            try {
                // 读取任务描述
                const userInput = await fs.readFile(filePath, 'utf-8');

                // 优化（减少迭代次数以加快批处理）
                const result = await optimizeTaskDecomposition(
                    userInput,
                    llmClient,
                    embeddingClient,
                    {
                        maxIterations: 2,
                        targetTDQ: 0.70,
                        verbose: false  // 静默模式
                    }
                );

                results.push({
                    task: taskName,
                    tdq: result.finalTDQ.score,
                    iterations: result.iterations,
                    issues: result.finalTDQ.issues.length,
                });

                console.log(`✅ 完成: TDQ = ${result.finalTDQ.score.toFixed(3)} (${result.iterations} 轮迭代)`);

            } catch (error) {
                console.error(`❌ 失败: ${error.message}`);
                results.push({
                    task: taskName,
                    tdq: 0,
                    iterations: 0,
                    issues: 0,
                    error: error.message,
                });
            }
        }

        // 汇总结果
        console.log('\n========================================');
        console.log('批处理结果汇总');
        console.log('========================================\n');

        // 排序
        results.sort((a, b) => b.tdq - a.tdq);

        console.log('| 任务 | TDQ | 迭代 | 问题 |');
        console.log('|------|-----|------|------|');

        results.forEach(r => {
            if (r.error) {
                console.log(`| ${r.task} | ERROR | - | - |`);
            } else {
                const grade = r.tdq >= 0.8 ? '🏆' : r.tdq >= 0.7 ? '✅' : r.tdq >= 0.6 ? '🟡' : '🔴';
                console.log(`| ${r.task} | ${r.tdq.toFixed(3)} ${grade} | ${r.iterations} | ${r.issues} |`);
            }
        });

        // 统计
        const successful = results.filter(r => !r.error);
        const avgTDQ = successful.reduce((sum, r) => sum + r.tdq, 0) / successful.length;
        const avgIterations = successful.reduce((sum, r) => sum + r.iterations, 0) / successful.length;

        console.log('\n📊 统计:');
        console.log(`  成功: ${successful.length}/${results.length}`);
        console.log(`  平均 TDQ: ${avgTDQ.toFixed(3)}`);
        console.log(`  平均迭代: ${avgIterations.toFixed(1)} 轮`);

        // 保存结果
        await fs.writeFile(
            'output_example04_batch.json',
            JSON.stringify(results, null, 2),
            'utf-8'
        );
        console.log('\n✅ 结果已保存: output_example04_batch.json');

    } catch (error) {
        console.error('❌ 错误:', error);
    }
}

main();
