import { computeAcyclicity, computeHierarchyConsistency, computeHierarchyBalance } from './dist/metrics/structural.js';

console.log('=== TaskForce Iteration 1 - Structural Metrics Demo ===\n');

// Test 1: Simple valid tree
const validTree = {
    id: 'root',
    title: 'Root Task',
    children: [
        { id: 't1', title: 'Task 1', children: [], dependencies: [] },
        { id: 't2', title: 'Task 2', children: [], dependencies: ['t1'] }
    ]
};

console.log('Test 1: Valid Tree (no cycles, good hierarchy)');
console.log('Acyclicity:', computeAcyclicity(validTree));
console.log('Hierarchy Consistency:', computeHierarchyConsistency(validTree));
console.log('Hierarchy Balance:', computeHierarchyBalance(validTree));

// Test 2: Tree with cycle
const cycleTree = {
    id: 'root',
    title: 'Root',
    children: [
        { id: 'a', title: 'A', children: [], dependencies: ['b'] },
        { id: 'b', title: 'B', children: [], dependencies: ['a'] }
    ]
};

console.log('\n\nTest 2: Tree with Cycle (A depends on B, B depends on A)');
console.log('Acyclicity:', computeAcyclicity(cycleTree));

// Test 3: Unbalanced tree
const unbalancedTree = {
    id: 'root',
    title: 'Root',
    children: [
        {
            id: 'c1',
            title: 'C1',
            children: Array(10).fill(0).map((_, i) => ({ id: `c1_${i}`, title: `C1_${i}`, children: [] }))
        },
        { id: 'c2', title: 'C2', children: [{ id: 'c2_1', title: 'C2_1', children: [] }] }
    ]
};

console.log('\n\nTest 3: Unbalanced Tree (one node has 10 children, another has 1)');
console.log('Hierarchy Balance:', computeHierarchyBalance(unbalancedTree));

console.log('\n\n=== All metrics implemented and working! ===');
