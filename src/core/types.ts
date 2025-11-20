export interface TaskNode {
  id: string;
  title: string;
  description?: string;
  priority?: 'P0' | 'P1' | 'P2';
  effort_estimate?: number; // Estimated effort (e.g., in hours or story points)
  children: TaskNode[];
  dependencies?: string[]; // List of task IDs that this task depends on
}

export interface EvaluationResult {
  score: number; // 0.0 to 1.0
  details?: any; // Additional context or reasons for the score
}
