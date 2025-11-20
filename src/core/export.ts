import type { TaskNode } from '../core/types.js';
import type { TDQResult } from '../metrics/tdq.js';

/**
 * Export task tree to JSON string
 */
export function exportToJSON(tree: TaskNode, pretty = true): string {
    return JSON.stringify(tree, null, pretty ? 2 : 0);
}

/**
 * Export task tree to Markdown format
 */
export function exportToMarkdown(tree: TaskNode, tdq?: TDQResult): string {
    let md = '';

    // Add TDQ score if provided
    if (tdq) {
        md += `# Task Decomposition Report\n\n`;
        md += `**TDQ Score: ${tdq.score.toFixed(3)}** ${tdq.score >= 0.8 ? '✅ Excellent' : tdq.score >= 0.6 ? '🟡 Good' : '🔴 Needs Improvement'}\n\n`;

        md += `## Metrics Breakdown\n\n`;
        md += `| Metric | Score | Weight |\n`;
        md += `|--------|-------|--------|\n`;
        md += `| Acyclicity (A) | ${tdq.breakdown.acyclicity.score.toFixed(2)} | ${tdq.weights.acyclicity} |\n`;
        md += `| Hierarchy (H) | ${tdq.breakdown.hierarchy.score.toFixed(2)} | ${tdq.weights.hierarchy} |\n`;
        md += `| Balance (B) | ${tdq.breakdown.balance.score.toFixed(2)} | ${tdq.weights.balance} |\n`;
        md += `| Granularity (G) | ${tdq.breakdown.granularity.score.toFixed(2)} | ${tdq.weights.granularity} |\n`;
        md += `| Redundancy (R) | ${tdq.breakdown.redundancy.score.toFixed(2)} | ${tdq.weights.redundancy} |\n`;
        md += `| Executability (E) | ${tdq.breakdown.executability.score.toFixed(2)} | ${tdq.weights.executability} |\n\n`;

        if (tdq.issues.length > 0) {
            md += `## Issues Found\n\n`;
            tdq.issues.forEach(issue => {
                md += `- ${issue}\n`;
            });
            md += `\n`;
        }

        md += `---\n\n`;
    }

    md += `# Task Tree\n\n`;
    md += renderTaskNode(tree, 0);

    return md;
}

function renderTaskNode(node: TaskNode, depth: number): string {
    const indent = '  '.repeat(depth);
    const marker = depth === 0 ? '#' : '-';

    let md = `${indent}${marker} ${node.title}\n`;

    if (node.description) {
        md += `${indent}  > ${node.description}\n`;
    }

    if (node.priority) {
        md += `${indent}  **Priority:** ${node.priority}\n`;
    }

    if (node.effort_estimate) {
        md += `${indent}  **Effort:** ${node.effort_estimate}h\n`;
    }

    if (node.dependencies && node.dependencies.length > 0) {
        md += `${indent}  **Depends on:** ${node.dependencies.join(', ')}\n`;
    }

    md += '\n';

    for (const child of node.children) {
        md += renderTaskNode(child, depth + 1);
    }

    return md;
}

/**
 * Save task tree to file
 */
export async function saveTaskTree(
    tree: TaskNode,
    filepath: string,
    format: 'json' | 'markdown' = 'json',
    tdq?: TDQResult
): Promise<void> {
    const fs = await import('fs/promises');

    let content: string;
    if (format === 'json') {
        content = exportToJSON(tree);
    } else {
        content = exportToMarkdown(tree, tdq);
    }

    await fs.writeFile(filepath, content, 'utf-8');
}
