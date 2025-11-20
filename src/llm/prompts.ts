import type { TaskNode } from '../core/types.js';

/**
 * Prompt for estimating task effort (in hours)
 */
export function getEstimateEffortPrompt(task: TaskNode): string {
    return `You are an expert software project estimator. 

Task:
Title: ${task.title}
Description: ${task.description || 'No description provided'}

Please estimate how many hours of work this task would take for an average developer. 
Respond with ONLY a single number (the estimated hours). 
If the task is too vague or large to estimate, respond with a number greater than 20.

Examples:
- "Fix typo in README" → 0.5
- "Implement user authentication" → 8
- "Build entire e-commerce platform" → 100

Your estimate (hours):`;
}

/**
 * Prompt for judging task executability (1-5 scale)
 */
export function getJudgeExecutabilityPrompt(task: TaskNode): string {
    return `You are evaluating whether a task is specific and actionable enough to be executed directly.

Task:
Title: ${task.title}
Description: ${task.description || 'No description provided'}

Rate this task's executability on a scale of 1-5:
1 = Extremely vague, impossible to execute (e.g., "Improve the system")
2 = Very vague, needs significant clarification (e.g., "Add features")
3 = Somewhat clear, but missing important details (e.g., "Implement login")
4 = Clear and actionable with minor ambiguity (e.g., "Add email validation to login form")
5 = Perfectly clear and immediately actionable (e.g., "Add email regex validation to login form's email input field")

Respond with ONLY a single number from 1 to 5.

Your rating:`;
}

/**
 * Prompt for generating task tree from user input
 */
export function getGenerateTaskTreePrompt(userInput: string): string {
    return `You are an expert project manager. Please decompose the following task into a detailed task tree.

**User Task:**
${userInput}

**Requirements:**
1. Create a hierarchical task tree with 2-3 levels minimum
2. Each task must be specific and actionable
3. Include task descriptions where helpful
4. Suggest effort estimates (in hours) for leaf tasks
5. Identify dependencies where applicable
6. Assign priorities (P0=Critical, P1=High, P2=Normal)

**Output Format:**
Return ONLY a valid JSON object following this schema:
{
  "id": "root",
  "title": "Main task title",
  "description": "Optional description",
  "priority": "P0",
  "children": [
    {
      "id": "task_1",
      "title": "Subtask 1",
      "description": "Details...",
      "effort_estimate": 5,
      "priority": "P1",
      "children": [],
      "dependencies": []
    }
  ],
  "dependencies": []
}

**Important:**
- Use descriptive IDs (e.g., "auth_login", "db_setup")
- Be specific in task titles (e.g., "Implement JWT-based login API" instead of "Do authentication")
- Ensure leaf tasks are small enough to complete in 1-8 hours
- Only return the JSON, no additional text`;
}

/**
 * Prompt for refining task tree based on TDQ feedback
 */
export function getRefineTaskTreePrompt(
    currentTree: TaskNode,
    issues: string[],
    scores: { granularity: number; executability: number; redundancy: number }
): string {
    return `You are an expert project manager. The current task decomposition has quality issues that need to be fixed.

**Current Task Tree:**
\`\`\`json
${JSON.stringify(currentTree, null, 2)}
\`\`\`

**Quality Scores:**
- Granularity: ${scores.granularity.toFixed(2)} (target: >= 0.7)
- Executability: ${scores.executability.toFixed(2)} (target: >= 0.7)
- Redundancy: ${scores.redundancy.toFixed(2)} (target: >= 0.8)

**Issues Found:**
${issues.map((issue, i) => `${i + 1}. ${issue}`).join('\n')}

**Your Task:**
Improve the task tree to address these issues:

1. **If Granularity is low:** Break down overly large tasks into smaller, manageable pieces (1-8 hours each)
2. **If Executability is low:** Make task descriptions more specific and actionable
3. **If Redundancy is low:** Merge or remove duplicate tasks

**Requirements:**
- Keep the same overall goal and structure
- Make tasks more specific and actionable
- Ensure proper granularity (1-8 hours for leaf tasks)
- Eliminate redundancy
- Maintain valid JSON structure

**Output Format:**
Return ONLY the improved task tree as a valid JSON object. No additional text or explanation.`;
}

/**
 * Prompt for decomposing a single task further
 */
export function getDecomposeTaskPrompt(task: TaskNode): string {
    return `You are an expert project manager. Please break down the following task into more detailed subtasks.

**Task to Decompose:**
- **Title:** ${task.title}
- **Description:** ${task.description || 'N/A'}
- **Estimated Effort:** ${task.effort_estimate || 'Unknown'} hours

**Requirements:**
1. Create 2-5 specific subtasks
2. Each subtask should be clear and actionable
3. Provide effort estimates (in hours)
4. Identify any dependencies between subtasks
5. Keep each subtask small (1-8 hours)

**Output Format:**
Return ONLY a JSON array of subtasks:
[
  {
    "id": "subtask_1",
    "title": "Specific subtask title",
    "description": "Details...",
    "effort_estimate": 3,
    "priority": "P1",
    "children": [],
    "dependencies": []
  }
]

Only return the JSON array, no additional text.`;
}
