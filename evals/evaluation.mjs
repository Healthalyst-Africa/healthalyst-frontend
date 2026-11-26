// Pure parts of the agent eval runner: reading tasks, judging Claude's reply
// and summarising results. Kept apart from run-evals.mjs so they can be
// tested without calling Claude.

export const DEFAULT_PASS_THRESHOLD = 0.8;

const TASK_DEFAULTS = {
  setupFiles: {},
  hiddenChecks: [],
  checks: [],
  requiredPatterns: [],
  forbiddenPatterns: [],
  maximumTurns: 25,
  maximumBudgetInDollars: 1,
};

export function validateTask(task, sourceName) {
  const problems = [];
  if (typeof task.name !== "string" || !/^[a-z0-9-]+$/.test(task.name)) {
    problems.push("name must be kebab-case");
  }
  if (typeof task.description !== "string" || task.description.trim() === "") {
    problems.push("description is required");
  }
  if (typeof task.prompt !== "string" || task.prompt.trim() === "") {
    problems.push("prompt is required");
  }
  if (
    typeof task.allowedTools !== "string" ||
    task.allowedTools.trim() === ""
  ) {
    problems.push(
      "allowedTools is required, so each eval states what Claude may use"
    );
  }
  const completeTask = { ...TASK_DEFAULTS, ...task };
  if (
    completeTask.checks.length === 0 &&
    completeTask.requiredPatterns.length === 0 &&
    completeTask.forbiddenPatterns.length === 0
  ) {
    problems.push(
      "at least one check, required pattern or forbidden pattern is needed"
    );
  }
  for (const pattern of [
    ...completeTask.requiredPatterns,
    ...completeTask.forbiddenPatterns,
  ]) {
    try {
      new RegExp(pattern, "i");
    } catch {
      problems.push(`invalid pattern: ${pattern}`);
    }
  }
  for (const filePath of [
    ...Object.keys(completeTask.setupFiles),
    ...completeTask.hiddenChecks.map((hiddenCheck) => hiddenCheck.destination),
  ]) {
    if (filePath.startsWith("/") || filePath.includes("..")) {
      problems.push(`file paths must stay inside the repository: ${filePath}`);
    }
  }
  if (problems.length > 0) {
    throw new Error(`${sourceName}: ${problems.join("; ")}`);
  }
  return completeTask;
}

export function judgeReply(task, replyText) {
  const failures = [];
  for (const pattern of task.requiredPatterns) {
    if (!new RegExp(pattern, "i").test(replyText)) {
      failures.push(`reply did not match required pattern ${pattern}`);
    }
  }
  for (const pattern of task.forbiddenPatterns) {
    if (new RegExp(pattern, "i").test(replyText)) {
      failures.push(`reply matched forbidden pattern ${pattern}`);
    }
  }
  return failures;
}

export function summariseResults(
  results,
  passThreshold = DEFAULT_PASS_THRESHOLD
) {
  const passedCount = results.filter(
    (result) => result.failures.length === 0
  ).length;
  const passRate = results.length === 0 ? 0 : passedCount / results.length;
  const totalCost = results.reduce(
    (total, result) => total + (result.costInDollars ?? 0),
    0
  );
  const lines = [
    "## Agent evals",
    "",
    `${passedCount} of ${results.length} passed (${(passRate * 100).toFixed(0)}%). The threshold is ${(passThreshold * 100).toFixed(0)}%. Cost: $${totalCost.toFixed(2)}.`,
    "",
    "| Eval | Result | Details |",
    "| --- | --- | --- |",
    ...results.map((result) => {
      const details =
        result.failures.join("; ").replaceAll("|", "\\|") ||
        "All checks passed";
      return `| ${result.name} | ${result.failures.length === 0 ? "Pass" : "Fail"} | ${details} |`;
    }),
    "",
  ];
  return {
    passed: passRate >= passThreshold,
    passRate,
    report: `${lines.join("\n")}\n`,
  };
}
