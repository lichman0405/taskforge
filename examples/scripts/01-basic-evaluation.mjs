/**
 * Example 01: Basic Evaluation
 * 
 * 演示如何评估一个预定义的任务树
 * 不进行优化，只进行评分
 */

// 加载环境变量（从项目根目录）
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, '../../');
dotenv.config({ path: join(projectRoot, '.env') });

import { computeTDQ, analyzeTDQIssues } from '../../dist/metrics/tdq.js';
import { createLLMClient, createEmbeddingClient } from '../../dist/llm/factory.js';
import { getLLMConfig, getEmbeddingConfig } from '../../dist/core/config.js';
import { exportToMarkdown } from '../../dist/core/export.js';
import fs from 'fs/promises';

console.log('=== Example 01: Basic Evaluation ===\n');

// 辅助函数：显示任务树结构
function displayTaskTree(node, prefix = '', isLast = true) {
    const connector = isLast ? '└── ' : '├── ';
    const line = prefix + connector + node.title;

    console.log(line);

    if (node.effort_estimate) {
        const effortPrefix = prefix + (isLast ? '    ' : '│   ');
        console.log(effortPrefix + '⏱️  ' + node.effort_estimate + 'h');
    }

    const childPrefix = prefix + (isLast ? '    ' : '│   ');
    if (node.children) {
        node.children.forEach((child, index) => {
            displayTaskTree(child, childPrefix, index === node.children.length - 1);
        });
    }
}

// 示例：一个简单的任务树
const sampleTaskTree = {
    id: 'root',
    title: '构建个人博客网站',
    description: '使用 Next.js 创建一个现代化的个人博客',
    children: [
        {
            id: 'frontend',
            title: '前端开发',
            children: [
                {
                    id: 'ui',
                    title: '设计和实现 UI 组件',
                    description: '创建 Header, Footer, Post Card 等组件',
                    effort_estimate: 6,
                    children: [],
                    dependencies: []
                },
                {
                    id: 'pages',
                    title: '实现主要页面',
                    description: '首页、文章列表、文章详情页、关于页',
                    effort_estimate: 8,
                    children: [],
                    dependencies: ['ui']
                },
            ],
            dependencies: []
        },
        {
            id: 'backend',
            title: '后端开发',
            children: [
                {
                    id: 'api',
                    title: '创建 API 路由',
                    description: '文章 CRUD API',
                    effort_estimate: 5,
                    children: [],
                    dependencies: []
                },
                {
                    id: 'db',
                    title: '设置数据库',
                    description: '使用 MongoDB 存储文章',
                    effort_estimate: 3,
                    children: [],
                    dependencies: []
                },
            ],
            dependencies: []
        },
        {
            id: 'deployment',
            title: '部署到 Vercel',
            description: '配置 CI/CD 和域名',
            effort_estimate: 2,
            children: [],
            dependencies: ['frontend', 'backend']
        }
    ],
    dependencies: []
};

async function main() {
    try {
        // 显示任务描述和结构
        console.log('📝 原始任务描述:');
        console.log(sampleTaskTree.description || sampleTaskTree.title);
        console.log('\n📋 任务树结构:');
        displayTaskTree(sampleTaskTree);
        console.log('\n' + '─'.repeat(50) + '\n');

        // 初始化客户端
        const llmConfig = getLLMConfig();
        const embeddingConfig = getEmbeddingConfig();

        console.log(`LLM Provider: ${llmConfig.provider}`);
        console.log(`Embedding Provider: ${embeddingConfig.provider}\n`);

        const llmClient = createLLMClient(llmConfig);
        const embeddingClient = createEmbeddingClient(embeddingConfig);

        // 评估任务树
        console.log('正在评估任务树...\n');
        const tdq = await computeTDQ(sampleTaskTree, llmClient, embeddingClient);

        // 输出结果
        console.log('========================================');
        console.log('评估结果');
        console.log('========================================\n');

        console.log(`TDQ 综合得分: ${tdq.score.toFixed(3)}\n`);

        console.log('各项指标：');
        console.log(`  Acyclicity (A):      ${tdq.breakdown.acyclicity.score.toFixed(3)}`);
        console.log(`  Hierarchy (H):       ${tdq.breakdown.hierarchy.score.toFixed(3)}`);
        console.log(`  Balance (B):         ${tdq.breakdown.balance.score.toFixed(3)}`);
        console.log(`  Granularity (G):     ${tdq.breakdown.granularity.score.toFixed(3)}`);
        console.log(`  Redundancy (R):      ${tdq.breakdown.redundancy.score.toFixed(3)}`);
        console.log(`  Executability (E):   ${tdq.breakdown.executability.score.toFixed(3)}\n`);

        // 分析问题
        const analysis = analyzeTDQIssues(tdq);
        console.log(analysis);

        // 导出报告
        const markdown = exportToMarkdown(sampleTaskTree, tdq);
        await fs.writeFile('output_example01.md', markdown, 'utf-8');
        console.log('\n✅ 报告已保存: output_example01.md');

    } catch (error) {
        console.error('错误:', error);
    }
}

main();
