import type { TaskNode, EvaluationResult } from '../core/types.js';

// Helper to traverse tree and collect all nodes
function getAllNodes(root: TaskNode): Map<string, TaskNode> {
    const nodes = new Map<string, TaskNode>();
    function traverse(node: TaskNode) {
        nodes.set(node.id, node);
        for (const child of node.children) {
            traverse(child);
        }
    }
    traverse(root);
    return nodes;
}

// Helper to calculate depths
function getNodeDepths(root: TaskNode): Map<string, number> {
    const depths = new Map<string, number>();
    function traverse(node: TaskNode, depth: number) {
        depths.set(node.id, depth);
        for (const child of node.children) {
            traverse(child, depth + 1);
        }
    }
    traverse(root, 0);
    return depths;
}

/**
 * 3.1 Acyclicity (A)
 * Checks for cycles in the graph formed by decomposition (parent->child) and dependencies.
 * Note: Dependencies are treated as edges. If A depends on B, we consider an edge A -> B.
 * (Or B -> A? Cycle detection works either way as long as consistent.
 *  If A depends on B, usually B must happen before A.
 *  If we view edges as "prerequisite", then A -> B means "A requires B".
 *  Tree edges are Parent -> Child (Parent contains Child).
 *  If Child depends on Parent (Child -> Parent), combined with Parent -> Child, we get cycle.
 *  This seems correct for detecting logical impossibilities.)
 */
export function computeAcyclicity(root: TaskNode): EvaluationResult {
    const nodes = getAllNodes(root);
    const adj = new Map<string, string[]>();

    // Initialize adjacency list
    for (const id of nodes.keys()) {
        adj.set(id, []);
    }

    // Build graph
    for (const node of nodes.values()) {
        // Decomposition edges: Parent -> Child
        for (const child of node.children) {
            adj.get(node.id)?.push(child.id);
        }
        // Dependency edges: Task -> Dependency
        if (node.dependencies) {
            for (const depId of node.dependencies) {
                // Only add if dependency exists in the tree
                if (nodes.has(depId)) {
                    adj.get(node.id)?.push(depId);
                }
            }
        }
    }

    // DFS for cycle detection
    const visited = new Set<string>();
    const recursionStack = new Set<string>();
    let hasCycle = false;

    function dfs(u: string) {
        if (hasCycle) return;
        visited.add(u);
        recursionStack.add(u);

        const neighbors = adj.get(u) || [];
        for (const v of neighbors) {
            if (!visited.has(v)) {
                dfs(v);
            } else if (recursionStack.has(v)) {
                hasCycle = true;
                return;
            }
        }
        recursionStack.delete(u);
    }

    for (const id of nodes.keys()) {
        if (!visited.has(id)) {
            dfs(id);
        }
        if (hasCycle) break;
    }

    return {
        score: hasCycle ? 0.0 : 1.0,
        details: { hasCycle }
    };
}

/**
 * 3.2 Hierarchy Consistency (H)
 * H = number_of_edges_with(depth(v) > depth(u)) / total_edges
 * Edges include decomposition and dependencies.
 */
export function computeHierarchyConsistency(root: TaskNode): EvaluationResult {
    const nodes = getAllNodes(root);
    const depths = getNodeDepths(root);

    let totalEdges = 0;
    let consistentEdges = 0;

    for (const node of nodes.values()) {
        const uDepth = depths.get(node.id)!;

        // Decomposition edges: Parent(u) -> Child(v)
        // depth(v) is always uDepth + 1, so consistent.
        for (const child of node.children) {
            totalEdges++;
            const vDepth = depths.get(child.id)!;
            if (vDepth > uDepth) {
                consistentEdges++;
            }
        }

        // Dependency edges: Task(u) -> Dependency(v)
        if (node.dependencies) {
            for (const depId of node.dependencies) {
                if (nodes.has(depId)) {
                    totalEdges++;
                    const vDepth = depths.get(depId)!;
                    if (vDepth > uDepth) {
                        consistentEdges++;
                    }
                }
            }
        }
    }

    if (totalEdges === 0) return { score: 1.0 };

    return {
        score: consistentEdges / totalEdges,
        details: { totalEdges, consistentEdges }
    };
}

/**
 * 3.3 Hierarchy Balance (B)
 * B = 1 - min(1, Var_deg / Var_max)
 * deg(v) = number of children for non-leaf nodes.
 */
export function computeHierarchyBalance(root: TaskNode): EvaluationResult {
    const nodes = getAllNodes(root);
    const childCounts: number[] = [];

    for (const node of nodes.values()) {
        // Only consider non-leaf nodes?
        // "令每个非叶节点的子节点数为 deg(v)"
        // If a node has 0 children, it is a leaf.
        // So we filter for nodes with children > 0?
        // Or do we include root even if it has 0 children (edge case)?
        // Usually "non-leaf" implies children.length > 0.
        if (node.children.length > 0) {
            childCounts.push(node.children.length);
        }
    }

    if (childCounts.length < 2) {
        // If 0 or 1 non-leaf node, variance is 0 (or undefined).
        // Perfect balance.
        return { score: 1.0, details: { variance: 0 } };
    }

    // Calculate Variance
    const mean = childCounts.reduce((a, b) => a + b, 0) / childCounts.length;
    const variance = childCounts.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / childCounts.length;

    const VAR_MAX = 5.0; // Suggested 4-6
    const score = 1.0 - Math.min(1.0, variance / VAR_MAX);

    return {
        score,
        details: { variance, childCounts }
    };
}
