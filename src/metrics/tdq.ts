import type { TaskNode, EvaluationResult } from '../core/types.js';
import type { LLMClient, EmbeddingClient } from '../llm/client.js';
import { computeAcyclicity, computeHierarchyConsistency, computeHierarchyBalance } from './structural.js';
import { computeRedundancy, computeGranularity, computeExecutability } from './semantic.js';

export interface TDQWeights {
    acyclicity: number;
    hierarchy: number;
    balance: number;
    granularity: number;
    redundancy: number;
    executability: number;
}

export interface TDQResult {
    score: number; // 0-1, weighted average
    breakdown: {
        acyclicity: EvaluationResult;
        hierarchy: EvaluationResult;
        balance: EvaluationResult;
        granularity: EvaluationResult;
        redundancy: EvaluationResult;
        executability: EvaluationResult;
    };
    weights: TDQWeights;
    issues: string[]; // Human-readable issues found
}

// Default weights from specification
export const DEFAULT_WEIGHTS: TDQWeights = {
    acyclicity: 0.10,
    hierarchy: 0.15,
    balance: 0.10,
    granularity: 0.20,
    redundancy: 0.10,
    executability: 0.25,
};

/**
 * Compute TDQ (Task Decomposition Quality) score
 * Integrates all metrics into a single quality score
 */
export async function computeTDQ(
    tree: TaskNode,
    llmClient: LLMClient,
    embeddingClient: EmbeddingClient,
    weights: TDQWeights = DEFAULT_WEIGHTS
): Promise<TDQResult> {
    // Compute all metrics
    const acyclicity = computeAcyclicity(tree);
    const hierarchy = computeHierarchyConsistency(tree);
    const balance = computeHierarchyBalance(tree);

    const redundancy = await computeRedundancy(tree, embeddingClient);
    const granularity = await computeGranularity(tree, llmClient);
    const executability = await computeExecutability(tree, llmClient);

    // Calculate weighted score
    const score =
        weights.acyclicity * acyclicity.score +
        weights.hierarchy * hierarchy.score +
        weights.balance * balance.score +
        weights.granularity * granularity.score +
        weights.redundancy * redundancy.score +
        weights.executability * executability.score;

    // Identify issues
    const issues: string[] = [];

    if (acyclicity.score === 0) {
        issues.push('❌ 任务依赖存在循环，必须修复');
    }

    if (hierarchy.score < 0.7) {
        issues.push(`⚠️ 层级一致性较低 (${hierarchy.score.toFixed(2)})，存在不合理的依赖关系`);
    }

    if (balance.score < 0.5) {
        issues.push(`⚠️ 任务分布不平衡 (${balance.score.toFixed(2)})，某些节点子任务过多或过少`);
    }

    if (granularity.score < 0.6) {
        issues.push(`⚠️ 任务粒度不合理 (${granularity.score.toFixed(2)})，有任务过大或过小`);
    }

    if (redundancy.score < 0.8) {
        issues.push(`⚠️ 存在重复任务 (${redundancy.score.toFixed(2)})`);
    }

    if (executability.score < 0.6) {
        issues.push(`⚠️ 任务可执行性较低 (${executability.score.toFixed(2)})，描述不够清晰`);
    }

    return {
        score,
        breakdown: {
            acyclicity,
            hierarchy,
            balance,
            granularity,
            redundancy,
            executability,
        },
        weights,
        issues,
    };
}

/**
 * Analyze TDQ result and generate improvement suggestions
 */
export function analyzeTDQIssues(tdqResult: TDQResult): string {
    const { breakdown } = tdqResult;

    let analysis = '## 任务拆解质量分析\n\n';

    analysis += `**综合得分 (TDQ): ${tdqResult.score.toFixed(3)}** ${tdqResult.score >= 0.8 ? '✅ 优秀' : tdqResult.score >= 0.6 ? '🟡 良好' : '🔴 需要改进'}\n\n`;

    analysis += '### 各项指标\n\n';
    analysis += `- **无环性 (A)**: ${breakdown.acyclicity.score.toFixed(2)} ${breakdown.acyclicity.score === 1 ? '✅' : '❌'}\n`;
    analysis += `- **层级一致性 (H)**: ${breakdown.hierarchy.score.toFixed(2)}\n`;
    analysis += `- **平衡性 (B)**: ${breakdown.balance.score.toFixed(2)}\n`;
    analysis += `- **粒度合理性 (G)**: ${breakdown.granularity.score.toFixed(2)}\n`;
    analysis += `- **冗余度 (R)**: ${breakdown.redundancy.score.toFixed(2)}\n`;
    analysis += `- **可执行性 (E)**: ${breakdown.executability.score.toFixed(2)}\n\n`;

    if (tdqResult.issues.length > 0) {
        analysis += '### 发现的问题\n\n';
        tdqResult.issues.forEach(issue => {
            analysis += `${issue}\n`;
        });
    } else {
        analysis += '### ✅ 未发现明显问题\n';
    }

    return analysis;
}
