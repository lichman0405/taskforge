import { computeAcyclicity, computeHierarchyConsistency, computeHierarchyBalance } from '../../src/metrics/structural.js';
import type { TaskNode } from '../../src/core/types.js';

describe('Structural Metrics', () => {

    describe('Acyclicity (A)', () => {
        test('should return 1.0 for a simple tree with no extra dependencies', () => {
            const root: TaskNode = {
                id: 'root', title: 'Root', children: [
                    { id: 'c1', title: 'C1', children: [] },
                    { id: 'c2', title: 'C2', children: [] }
                ]
            };
            expect(computeAcyclicity(root).score).toBe(1.0);
        });

        test('should return 1.0 for valid dependencies (downward)', () => {
            const root: TaskNode = {
                id: 'root', title: 'Root', children: [
                    { id: 'c1', title: 'C1', children: [], dependencies: [] },
                    { id: 'c2', title: 'C2', children: [], dependencies: ['c1'] } // c2 depends on c1
                ]
            };
            // Graph: root->c1, root->c2, c2->c1. No cycle.
            expect(computeAcyclicity(root).score).toBe(1.0);
        });

        test('should return 0.0 for direct cycle', () => {
            const root: TaskNode = {
                id: 'root', title: 'Root', children: [], dependencies: ['root']
            };
            expect(computeAcyclicity(root).score).toBe(0.0);
        });

        test('should return 0.0 for indirect cycle via dependencies', () => {
            // A -> B (dep), B -> A (dep)
            const root: TaskNode = {
                id: 'root', title: 'Root', children: [
                    { id: 'a', title: 'A', children: [], dependencies: ['b'] },
                    { id: 'b', title: 'B', children: [], dependencies: ['a'] }
                ]
            };
            expect(computeAcyclicity(root).score).toBe(0.0);
        });

        test('should return 0.0 for cycle involving decomposition', () => {
            // Parent -> Child (decomp), Child -> Parent (dep)
            const root: TaskNode = {
                id: 'root', title: 'Root', children: [
                    { id: 'child', title: 'Child', children: [], dependencies: ['root'] }
                ]
            };
            expect(computeAcyclicity(root).score).toBe(0.0);
        });
    });

    describe('Hierarchy Consistency (H)', () => {
        test('should return 1.0 for pure tree', () => {
            const root: TaskNode = {
                id: 'root', title: 'Root', children: [
                    { id: 'c1', title: 'C1', children: [] }
                ]
            };
            // Edge: root->c1. depth(c1)=1 > depth(root)=0. Consistent.
            expect(computeHierarchyConsistency(root).score).toBe(1.0);
        });

        test('should penalize upward dependencies', () => {
            // root(0) -> c1(1). c1 depends on root. c1->root.
            // Edge 1: root->c1 (valid)
            // Edge 2: c1->root (invalid, depth(root)=0 < depth(c1)=1)
            // Score: 1/2 = 0.5
            const root: TaskNode = {
                id: 'root', title: 'Root', children: [
                    { id: 'c1', title: 'C1', children: [], dependencies: ['root'] }
                ]
            };
            expect(computeHierarchyConsistency(root).score).toBe(0.5);
        });

        test('should penalize sibling dependencies (equal depth)', () => {
            // root(0) -> a(1), root(0) -> b(1).
            // a depends on b. a->b. depth(b)=1, depth(a)=1. Not >.
            // Edges: root->a (valid), root->b (valid), a->b (invalid)
            // Score: 2/3 = 0.666...
            const root: TaskNode = {
                id: 'root', title: 'Root', children: [
                    { id: 'a', title: 'A', children: [], dependencies: ['b'] },
                    { id: 'b', title: 'B', children: [] }
                ]
            };
            expect(computeHierarchyConsistency(root).score).toBeCloseTo(2 / 3);
        });
    });

    describe('Hierarchy Balance (B)', () => {
        test('should return 1.0 for perfectly balanced tree', () => {
            // Root has 2 children. Each child has 2 children.
            // Counts: [2, 2, 2]. Variance = 0.
            const root: TaskNode = {
                id: 'root', title: 'Root', children: [
                    {
                        id: 'c1', title: 'C1', children: [
                            { id: 'c11', title: 'C11', children: [] },
                            { id: 'c12', title: 'C12', children: [] }
                        ]
                    },
                    {
                        id: 'c2', title: 'C2', children: [
                            { id: 'c21', title: 'C21', children: [] },
                            { id: 'c22', title: 'C22', children: [] }
                        ]
                    }
                ]
            };
            expect(computeHierarchyBalance(root).score).toBe(1.0);
        });

        test('should return lower score for unbalanced tree', () => {
            // Root has 2 children.
            // C1 has 10 children.
            // C2 has 1 child.
            // Counts: [2, 10, 1]. Mean = 4.33.
            // Variance approx: ((2-4.33)^2 + (10-4.33)^2 + (1-4.33)^2)/3
            // = (5.42 + 32.14 + 11.08)/3 = 16.21
            // Max Var = 5.
            // Score = 1 - min(1, 16.21/5) = 1 - 1 = 0.
            const c1Children = Array(10).fill(null).map((_, i) => ({ id: `c1_${i}`, title: `C1_${i}`, children: [] }));
            const c2Children = [{ id: 'c2_1', title: 'C2_1', children: [] }];

            const root: TaskNode = {
                id: 'root', title: 'Root', children: [
                    { id: 'c1', title: 'C1', children: c1Children },
                    { id: 'c2', title: 'C2', children: c2Children }
                ]
            };
            expect(computeHierarchyBalance(root).score).toBe(0.0);
        });
    });

});
