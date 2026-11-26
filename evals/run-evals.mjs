// Runs every task in evals/tasks against Claude Code in headless mode and
// fails when fewer than 80% pass. Each task starts from a clean working
// tree, and the tree is reset after it, so this refuses to run outside CI
// unless you pass --reset-working-tree and have no uncommitted changes.
//
//   node evals/run-evals.mjs [--task <name>] [--summary <file>] [--reset-working-tree]

import { spawnSync } from "node:child_process";
import {
  appendFileSync,
  copyFileSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { readCommandLineOptions } from "../scripts/command-line-options.mjs";
import { judgeReply, summariseResults, validateTask } from "./evaluation.mjs";

const REPOSITORY_ROOT = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  ".."
);
const TASKS_DIRECTORY = path.join(REPOSITORY_ROOT, "evals", "tasks");
const TASK_TIME_LIMIT_IN_MILLISECONDS = 15 * 60 * 1000;

function runGit(gitArguments) {
  return spawnSync("git", gitArguments, {
    cwd: REPOSITORY_ROOT,
    encoding: "utf8",
  });
}

function resetWorkingTree(task) {
  for (const filePath of Object.keys(task.setupFiles)) {
    rmSync(path.join(REPOSITORY_ROOT, filePath), { force: true });
  }
  runGit(["checkout", "--", "."]);
  runGit(["clean", "-fdq", "--exclude=node_modules"]);
}

function runClaude(task) {
  const claudeArguments = [
    "-p",
    "--output-format",
    "json",
    "--max-turns",
    String(task.maximumTurns),
    "--max-budget-usd",
    String(task.maximumBudgetInDollars),
    "--permission-mode",
    "acceptEdits",
    "--allowedTools",
    task.allowedTools,
  ];
  const execution = spawnSync("claude", claudeArguments, {
    cwd: REPOSITORY_ROOT,
    input: task.prompt,
    encoding: "utf8",
    maxBuffer: 64 * 1024 * 1024,
    timeout: TASK_TIME_LIMIT_IN_MILLISECONDS,
  });
  if (execution.error) {
    return {
      replyText: "",
      costInDollars: 0,
      failure: `Claude did not run: ${execution.error.message}`,
    };
  }
  try {
    const reply = JSON.parse(execution.stdout);
    return {
      replyText: String(reply.result ?? ""),
      costInDollars: reply.total_cost_usd ?? 0,
    };
  } catch {
    return {
      replyText: execution.stdout ?? "",
      costInDollars: 0,
      failure: `Claude exited with code ${execution.status} and no JSON reply`,
    };
  }
}

function runCheck(command) {
  const execution = spawnSync(command, {
    cwd: REPOSITORY_ROOT,
    shell: true,
    encoding: "utf8",
    maxBuffer: 64 * 1024 * 1024,
  });
  return execution.status === 0;
}

function runTask(task) {
  console.log(`\n▶ ${task.name}: ${task.description}`);
  for (const [filePath, content] of Object.entries(task.setupFiles)) {
    const absolutePath = path.join(REPOSITORY_ROOT, filePath);
    mkdirSync(path.dirname(absolutePath), { recursive: true });
    writeFileSync(absolutePath, content);
  }

  const claudeResult = runClaude(task);
  const failures = claudeResult.failure ? [claudeResult.failure] : [];
  failures.push(...judgeReply(task, claudeResult.replyText));

  for (const hiddenCheck of task.hiddenChecks) {
    const destination = path.join(REPOSITORY_ROOT, hiddenCheck.destination);
    mkdirSync(path.dirname(destination), { recursive: true });
    copyFileSync(path.join(REPOSITORY_ROOT, hiddenCheck.source), destination);
  }
  for (const command of task.checks) {
    if (!runCheck(command)) failures.push(`check failed: ${command}`);
  }

  resetWorkingTree(task);
  console.log(
    failures.length === 0 ? "  Pass" : `  Fail: ${failures.join("; ")}`
  );
  return {
    name: task.name,
    failures,
    costInDollars: claudeResult.costInDollars,
  };
}

function loadTasks(onlyTaskName) {
  return readdirSync(TASKS_DIRECTORY)
    .filter((fileName) => fileName.endsWith(".json"))
    .sort()
    .map((fileName) =>
      validateTask(
        JSON.parse(readFileSync(path.join(TASKS_DIRECTORY, fileName), "utf8")),
        fileName
      )
    )
    .filter((task) => !onlyTaskName || task.name === onlyTaskName);
}

function main() {
  const options = readCommandLineOptions(process.argv.slice(2));
  if (process.env.CI !== "true" && options["reset-working-tree"] !== true) {
    console.error(
      "The eval runner resets the working tree after each task. Run it in CI, or pass --reset-working-tree on a clean checkout."
    );
    process.exit(1);
  }
  if (runGit(["status", "--porcelain"]).stdout.trim() !== "") {
    console.error(
      "Commit or stash your changes first: the eval runner needs a clean working tree."
    );
    process.exit(1);
  }

  const tasks = loadTasks(
    typeof options.task === "string" ? options.task : undefined
  );
  if (tasks.length === 0) {
    console.error("No eval tasks matched.");
    process.exit(1);
  }
  const summary = summariseResults(tasks.map(runTask));
  process.stdout.write(`\n${summary.report}`);
  if (typeof options.summary === "string")
    appendFileSync(options.summary, summary.report);
  if (!summary.passed) process.exitCode = 1;
}

main();
