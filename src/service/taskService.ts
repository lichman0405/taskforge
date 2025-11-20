import type { TaskNode } from '../core/types.js';
import type { LLMClient, EmbeddingClient } from '../llm/client.js';
import type { TDQResult } from '../metrics/tdq.js';
import { computeTDQ, analyzeTDQIssues } from '../metrics/tdq.js';
import { getGenerateTaskTreePrompt, getRefineTaskTreePrompt, getDecomposeTaskPrompt } from '../llm/prompts.js';

export interface OptimizationConfig {
    maxIterations: number;
    targetTDQ: number;
    verbose: boolean;
}

export interface OptimizationResult {
    finalTree: TaskNode;
    finalTDQ: TDQResult;
    iterations: number;
    history: Array<{
        iteration: number;
        tdq: number;
        issues: string[];
    }>;
}

const DEFAULT_CONFIG: OptimizationConfig = {
    maxIterations: 5,
    targetTDQ: 0.75,
    verbose: true,
};

/**
 * Helper to clean and parse JSON from LLM response
 */
function cleanAndParseJSON<T>(response: string): T {
    // Remove markdown code blocks
    let cleaned = response.replace(/```json/g, '').replace(/```/g, '');

    // Find first '{' or '[' and last '}' or ']'
    const firstBrace = cleaned.indexOf('{');
    const firstBracket = cleaned.indexOf('[');
    const start = (firstBrace !== -1 && (firstBracket === -1 || firstBrace < firstBracket)) ? firstBrace : firstBracket;

    const lastBrace = cleaned.lastIndexOf('}');
    const lastBracket = cleaned.lastIndexOf(']');
    const end = (lastBrace !== -1 && (lastBracket === -1 || lastBrace > lastBracket)) ? lastBrace : lastBracket;

    if (start === -1 || end === -1) {
        throw new Error('No JSON object or array found in response');
    }

    cleaned = cleaned.substring(start, end + 1);

    try {
        return JSON.parse(cleaned) as T;
    } catch (error) {
        console.error('JSON Parse Error. Raw response:', response);
        console.error('Cleaned response:', cleaned);
        throw error;
    }
}

/**
 * Generate initial task tree from user input
 */
export async function generateTaskTree(
    userInput: string,
    llmClient: LLMClient
): Promise<TaskNode> {
    const prompt = getGenerateTaskTreePrompt(userInput);
    const response = await llmClient.chat([{ role: 'user', content: prompt }]);
    return cleanAndParseJSON<TaskNode>(response);
}

/**
 * Refine task tree based on TDQ feedback
 */
async function refineTaskTree(
    currentTree: TaskNode,
    tdqResult: TDQResult,
    llmClient: LLMClient
): Promise<TaskNode> {
    const scores = {
        granularity: tdqResult.breakdown.granularity.score,
        executability: tdqResult.breakdown.executability.score,
        redundancy: tdqResult.breakdown.redundancy.score,
    };

    const prompt = getRefineTaskTreePrompt(currentTree, tdqResult.issues, scores);
    const response = await llmClient.chat([{ role: 'user', content: prompt }]);
    return cleanAndParseJSON<TaskNode>(response);
}

/**
 * Auto-optimize task decomposition through iterative refinement
 */
export async function optimizeTaskDecomposition(
    userInput: string,
    llmClient: LLMClient,
    embeddingClient: EmbeddingClient,
    config: Partial<OptimizationConfig> = {}
): Promise<OptimizationResult> {
    const finalConfig = { ...DEFAULT_CONFIG, ...config };

    if (finalConfig.verbose) {
        console.log('🚀 Starting task decomposition optimization...\n');
        console.log(`Target TDQ: ${finalConfig.targetTDQ}`);
        console.log(`Max Iterations: ${finalConfig.maxIterations}\n`);
    }

    // Generate initial task tree
    if (finalConfig.verbose) {
        console.log('📝 Generating initial task tree...');
    }

    let currentTree = await generateTaskTree(userInput, llmClient);

    const history: OptimizationResult['history'] = [];
    let iteration = 0;

    while (iteration < finalConfig.maxIterations) {
        if (finalConfig.verbose) {
            console.log(`\n--- Iteration ${iteration + 1} ---`);
            console.log('🔍 Evaluating task tree...');
        }

        // Compute TDQ
        const tdqResult = await computeTDQ(currentTree, llmClient, embeddingClient);

        if (finalConfig.verbose) {
            console.log(`TDQ Score: ${tdqResult.score.toFixed(3)}`);
            if (tdqResult.issues.length > 0) {
                console.log('Issues:');
                tdqResult.issues.forEach(issue => console.log(`  ${issue}`));
            }
        }

        // Record history
        history.push({
            iteration: iteration + 1,
            tdq: tdqResult.score,
            issues: tdqResult.issues,
        });

        // Check if target achieved
        if (tdqResult.score >= finalConfig.targetTDQ) {
            if (finalConfig.verbose) {
                console.log(`\n✅ Target TDQ achieved! (${tdqResult.score.toFixed(3)} >= ${finalConfig.targetTDQ})`);
                console.log(`Total iterations: ${iteration + 1}`);
            }

            return {
                finalTree: currentTree,
                finalTDQ: tdqResult,
                iterations: iteration + 1,
                history,
            };
        }

        // Refine if not at max iterations
        if (iteration < finalConfig.maxIterations - 1) {
            if (finalConfig.verbose) {
                console.log('🔧 Refining task tree based on feedback...');
            }

            currentTree = await refineTaskTree(currentTree, tdqResult, llmClient);
        }

        iteration++;
    }

    // Max iterations reached
    const finalTDQ = await computeTDQ(currentTree, llmClient, embeddingClient);

    if (finalConfig.verbose) {
        console.log(`\n⚠️ Max iterations reached (${finalConfig.maxIterations})`);
        console.log(`Final TDQ: ${finalTDQ.score.toFixed(3)}`);
    }

    return {
        finalTree: currentTree,
        finalTDQ,
        iterations: finalConfig.maxIterations,
        history,
    };
}

/**
 * Decompose a single task into subtasks
 */
export async function decomposeTask(
    task: TaskNode,
    llmClient: LLMClient
): Promise<TaskNode[]> {
    const prompt = getDecomposeTaskPrompt(task);
    const response = await llmClient.chat([{ role: 'user', content: prompt }]);
    return cleanAndParseJSON<TaskNode[]>(response);
}
