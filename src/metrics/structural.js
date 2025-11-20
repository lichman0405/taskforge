"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.computeAcyclicity = computeAcyclicity;
exports.computeHierarchyConsistency = computeHierarchyConsistency;
exports.computeHierarchyBalance = computeHierarchyBalance;
// Helper to traverse tree and collect all nodes
function getAllNodes(root) {
    var nodes = new Map();
    function traverse(node) {
        nodes.set(node.id, node);
        for (var _i = 0, _a = node.children; _i < _a.length; _i++) {
            var child = _a[_i];
            traverse(child);
        }
    }
    traverse(root);
    return nodes;
}
// Helper to calculate depths
function getNodeDepths(root) {
    var depths = new Map();
    function traverse(node, depth) {
        depths.set(node.id, depth);
        for (var _i = 0, _a = node.children; _i < _a.length; _i++) {
            var child = _a[_i];
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
function computeAcyclicity(root) {
    var _a, _b;
    var nodes = getAllNodes(root);
    var adj = new Map();
    // Initialize adjacency list
    for (var _i = 0, _c = nodes.keys(); _i < _c.length; _i++) {
        var id = _c[_i];
        adj.set(id, []);
    }
    // Build graph
    for (var _d = 0, _e = nodes.values(); _d < _e.length; _d++) {
        var node = _e[_d];
        // Decomposition edges: Parent -> Child
        for (var _f = 0, _g = node.children; _f < _g.length; _f++) {
            var child = _g[_f];
            (_a = adj.get(node.id)) === null || _a === void 0 ? void 0 : _a.push(child.id);
        }
        // Dependency edges: Task -> Dependency
        if (node.dependencies) {
            for (var _h = 0, _j = node.dependencies; _h < _j.length; _h++) {
                var depId = _j[_h];
                // Only add if dependency exists in the tree
                if (nodes.has(depId)) {
                    (_b = adj.get(node.id)) === null || _b === void 0 ? void 0 : _b.push(depId);
                }
            }
        }
    }
    // DFS for cycle detection
    var visited = new Set();
    var recursionStack = new Set();
    var hasCycle = false;
    function dfs(u) {
        if (hasCycle)
            return;
        visited.add(u);
        recursionStack.add(u);
        var neighbors = adj.get(u) || [];
        for (var _i = 0, neighbors_1 = neighbors; _i < neighbors_1.length; _i++) {
            var v = neighbors_1[_i];
            if (!visited.has(v)) {
                dfs(v);
            }
            else if (recursionStack.has(v)) {
                hasCycle = true;
                return;
            }
        }
        recursionStack.delete(u);
    }
    for (var _k = 0, _l = nodes.keys(); _k < _l.length; _k++) {
        var id = _l[_k];
        if (!visited.has(id)) {
            dfs(id);
        }
        if (hasCycle)
            break;
    }
    return {
        score: hasCycle ? 0.0 : 1.0,
        details: { hasCycle: hasCycle }
    };
}
/**
 * 3.2 Hierarchy Consistency (H)
 * H = number_of_edges_with(depth(v) > depth(u)) / total_edges
 * Edges include decomposition and dependencies.
 */
function computeHierarchyConsistency(root) {
    var nodes = getAllNodes(root);
    var depths = getNodeDepths(root);
    var totalEdges = 0;
    var consistentEdges = 0;
    for (var _i = 0, _a = nodes.values(); _i < _a.length; _i++) {
        var node = _a[_i];
        var uDepth = depths.get(node.id);
        // Decomposition edges: Parent(u) -> Child(v)
        // depth(v) is always uDepth + 1, so consistent.
        for (var _b = 0, _c = node.children; _b < _c.length; _b++) {
            var child = _c[_b];
            totalEdges++;
            var vDepth = depths.get(child.id);
            if (vDepth > uDepth) {
                consistentEdges++;
            }
        }
        // Dependency edges: Task(u) -> Dependency(v)
        if (node.dependencies) {
            for (var _d = 0, _e = node.dependencies; _d < _e.length; _d++) {
                var depId = _e[_d];
                if (nodes.has(depId)) {
                    totalEdges++;
                    var vDepth = depths.get(depId);
                    if (vDepth > uDepth) {
                        consistentEdges++;
                    }
                }
            }
        }
    }
    if (totalEdges === 0)
        return { score: 1.0 };
    return {
        score: consistentEdges / totalEdges,
        details: { totalEdges: totalEdges, consistentEdges: consistentEdges }
    };
}
/**
 * 3.3 Hierarchy Balance (B)
 * B = 1 - min(1, Var_deg / Var_max)
 * deg(v) = number of children for non-leaf nodes.
 */
function computeHierarchyBalance(root) {
    var nodes = getAllNodes(root);
    var childCounts = [];
    for (var _i = 0, _a = nodes.values(); _i < _a.length; _i++) {
        var node = _a[_i];
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
    var mean = childCounts.reduce(function (a, b) { return a + b; }, 0) / childCounts.length;
    var variance = childCounts.reduce(function (a, b) { return a + Math.pow(b - mean, 2); }, 0) / childCounts.length;
    var VAR_MAX = 5.0; // Suggested 4-6
    var score = 1.0 - Math.min(1.0, variance / VAR_MAX);
    return {
        score: score,
        details: { variance: variance, childCounts: childCounts }
    };
}
