/**
 * TaskForge - Intelligent Task Decomposition & Optimization
 * 
 * Main Entry Point
 */

// Core Types
export type { TaskNode, EvaluationResult } from './core/types.js';
export type { LLMConfig, EmbeddingConfig } from './core/config.js';
export { getLLMConfig, getEmbeddingConfig } from './core/config.js';

// LLM & Embedding Clients
export type { LLMClient, EmbeddingClient } from './llm/client.js';
export { createLLMClient, createEmbeddingClient } from './llm/factory.js';

// Metrics & Evaluation
export type { TDQResult, TDQBreakdown } from './metrics/tdq.js';
export { computeTDQ, analyzeTDQIssues, DEFAULT_WEIGHTS } from './metrics/tdq.js';

// Main Service (Optimization Loop)
export {
    optimizeTaskDecomposition,
    generateTaskTree,
    decomposeTask
} from './service/taskService.js';
export type { OptimizationConfig, OptimizationResult } from './service/taskService.js';

// Utilities
export { exportToJSON, exportToMarkdown, saveTaskTree } from './core/export.js';
