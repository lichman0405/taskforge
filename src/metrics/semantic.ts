import type { TaskNode, EvaluationResult } from '../core/types.js';
import type { LLMClient, EmbeddingClient } from '../llm/client.js';
import { getEstimateEffortPrompt, getJudgeExecutabilityPrompt } from '../llm/prompts.js';

/**
 * Helper to collect all nodes from tree
 */
function getAllNodes(root: TaskNode): TaskNode[] {
    const nodes: TaskNode[] = [];
    function traverse(node: TaskNode) {
        nodes.push(node);
        for (const child of node.children) {
            traverse(child);
        }
    }
    traverse(root);
    return nodes;
}

/**
 * Helper to get leaf nodes only
 */
function getLeafNodes(root: TaskNode): TaskNode[] {
    const leaves: TaskNode[] = [];
    function traverse(node: TaskNode) {
        if (node.children.length === 0) {
            leaves.push(node);
        } else {
            for (const child of node.children) {
                traverse(child);
            }
        }
    }
    traverse(root);
    return leaves;
}

/**
 * Calculate cosine similarity between two vectors
 */
function cosineSimilarity(a: number[], b: number[]): number {
    if (a.length !== b.length) {
        throw new Error('Vectors must have the same length');
    }

    let dotProduct = 0;
    let normA = 0;
    let normB = 0;

    for (let i = 0; i < a.length; i++) {
        dotProduct += a[i]! * b[i]!;
        normA += a[i]! * a[i]!;
        normB += b[i]! * b[i]!;
    }

    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

/**
 * 3.5 Redundancy (R)
 * Detect redundant tasks using embedding similarity
 */
export async function computeRedundancy(
    root: TaskNode,
    embeddingClient: EmbeddingClient,
    threshold = 0.8
): Promise<EvaluationResult> {
    const nodes = getAllNodes(root);

    if (nodes.length < 2) {
        return { score: 1.0, details: { redundantPairs: 0, totalPairs: 0 } };
    }

    // Generate embeddings for all nodes
    const embeddings: number[][] = [];
    for (const node of nodes) {
        const text = `${node.title} ${node.description || ''}`.trim();
        const embedding = await embeddingClient.embed(text);
        embeddings.push(embedding);
    }

    // Count highly similar pairs
    let redundantPairs = 0;
    let totalPairs = 0;
    const similarPairs: Array<{ i: number; j: number; similarity: number }> = [];

    for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
            totalPairs++;
            const similarity = cosineSimilarity(embeddings[i]!, embeddings[j]!);

            if (similarity > threshold) {
                redundantPairs++;
                similarPairs.push({
                    i,
                    j,
                    similarity,
                });
            }
        }
    }

    const redundancyRatio = totalPairs > 0 ? redundantPairs / totalPairs : 0;
    const score = 1 - redundancyRatio;

    return {
        score,
        details: {
            redundantPairs,
            totalPairs,
            threshold,
            similarPairs: similarPairs.slice(0, 5), // Top 5 for debugging
        },
    };
}

/**
 * 3.4 Granularity Reasonableness (G)
 * Evaluate if leaf tasks have appropriate granularity
 */
export async function computeGranularity(
    root: TaskNode,
    llmClient: LLMClient,
    idealRange = { min: 1, max: 8 },
    alpha = 1.0
): Promise<EvaluationResult> {
    const leaves = getLeafNodes(root);

    if (leaves.length === 0) {
        return { score: 1.0, details: { leafCount: 0 } };
    }

    const scores: number[] = [];
    const efforts: Array<{ task: string; effort: number; score: number }> = [];

    for (const leaf of leaves) {
        // Ask LLM to estimate effort
        const prompt = getEstimateEffortPrompt(leaf);
        const response = await llmClient.chat([{ role: 'user', content: prompt }]);

        // Parse effort (extract number from response)
        const effort = parseFloat(response.trim());

        if (isNaN(effort)) {
            // If LLM fails to give a number, assume moderate score
            scores.push(0.5);
            efforts.push({ task: leaf.title, effort: -1, score: 0.5 });
            continue;
        }

        // Calculate granularity score
        let score: number;
        if (effort >= idealRange.min && effort <= idealRange.max) {
            score = 1.0;
        } else {
            const mid = (idealRange.min + idealRange.max) / 2;
            score = Math.exp(-alpha * Math.abs(effort - mid) / mid);
        }

        scores.push(score);
        efforts.push({ task: leaf.title, effort, score });
    }

    const avgScore = scores.reduce((a, b) => a + b, 0) / scores.length;

    return {
        score: avgScore,
        details: {
            leafCount: leaves.length,
            idealRange,
            efforts,
        },
    };
}

/**
 * 3.6 Executability (E)
 * Use LLM to judge if leaf tasks are executable
 */
export async function computeExecutability(
    root: TaskNode,
    llmClient: LLMClient
): Promise<EvaluationResult> {
    const leaves = getLeafNodes(root);

    if (leaves.length === 0) {
        return { score: 1.0, details: { leafCount: 0 } };
    }

    const ratings: Array<{ task: string; rating: number; normalized: number }> = [];

    for (const leaf of leaves) {
        const prompt = getJudgeExecutabilityPrompt(leaf);
        const response = await llmClient.chat([{ role: 'user', content: prompt }]);

        // Parse rating (1-5)
        const rating = parseInt(response.trim(), 10);

        if (isNaN(rating) || rating < 1 || rating > 5) {
            // Default to moderate score if parsing fails
            ratings.push({ task: leaf.title, rating: 3, normalized: 0.5 });
            continue;
        }

        // Normalize to 0-1
        const normalized = (rating - 1) / 4;
        ratings.push({ task: leaf.title, rating, normalized });
    }

    const avgScore = ratings.reduce((sum, r) => sum + r.normalized, 0) / ratings.length;

    return {
        score: avgScore,
        details: {
            leafCount: leaves.length,
            ratings,
        },
    };
}
