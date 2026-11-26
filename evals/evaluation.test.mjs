import assert from "node:assert/strict";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { describe, test } from "node:test";

import { judgeReply, summariseResults, validateTask } from "./evaluation.mjs";

const TASKS_DIRECTORY = new URL("./tasks/", import.meta.url);
const VALID_TASK = {
  name: "example-task",
  description: "An example.",
  prompt: "Do the thing.",
  allowedTools: "Read",
  requiredPatterns: ["done"],
};

describe("validateTask", () => {
  test("fills in defaults for a valid task", () => {
    const task = validateTask(VALID_TASK, "example.json");
    assert.equal(task.maximumTurns, 25);
    assert.deepEqual(task.checks, []);
  });

  test("rejects a task with nothing to judge it by", () => {
    assert.throws(
      () => validateTask({ ...VALID_TASK, requiredPatterns: [] }, "empty.json"),
      /at least one check/
    );
  });

  test("rejects files outside the repository", () => {
    assert.throws(
      () =>
        validateTask(
          { ...VALID_TASK, setupFiles: { "../outside.txt": "x" } },
          "escape.json"
        ),
      /inside the repository/
    );
  });

  test("every task in evals/tasks is valid and its referenced files exist", () => {
    const taskFiles = readdirSync(TASKS_DIRECTORY).filter((fileName) =>
      fileName.endsWith(".json")
    );
    assert.ok(taskFiles.length >= 5);
    for (const fileName of taskFiles) {
      const task = validateTask(
        JSON.parse(readFileSync(new URL(fileName, TASKS_DIRECTORY), "utf8")),
        fileName
      );
      assert.equal(`${task.name}.json`, fileName);
      for (const hiddenCheck of task.hiddenChecks) {
        assert.ok(
          existsSync(new URL(`../${hiddenCheck.source}`, import.meta.url)),
          hiddenCheck.source
        );
      }
    }
  });
});

describe("judgeReply", () => {
  const task = validateTask(
    {
      ...VALID_TASK,
      requiredPatterns: ["--base[ =]dev\\b"],
      forbiddenPatterns: ["secret-value"],
    },
    "judge.json"
  );

  test("passes a reply that meets every pattern", () => {
    assert.deepEqual(judgeReply(task, "gh pr create --base dev --fill"), []);
  });

  test("reports a missing required pattern and a forbidden one", () => {
    const failures = judgeReply(task, "gh pr create --base main secret-value");
    assert.equal(failures.length, 2);
  });
});

describe("summariseResults", () => {
  test("passes at the threshold and reports each eval", () => {
    const summary = summariseResults(
      [
        { name: "first", failures: [], costInDollars: 0.2 },
        { name: "second", failures: [], costInDollars: 0.3 },
        { name: "third", failures: [], costInDollars: 0.1 },
        { name: "fourth", failures: [], costInDollars: 0 },
        { name: "fifth", failures: ["check failed: lint | types"] },
      ],
      0.8
    );
    assert.equal(summary.passed, true);
    assert.match(summary.report, /4 of 5 passed \(80%\)/);
    assert.match(summary.report, /Cost: \$0\.60/);
    assert.match(summary.report, /lint \\\| types/);
  });

  test("fails below the threshold", () => {
    const summary = summariseResults([
      { name: "only", failures: ["reply did not match"] },
    ]);
    assert.equal(summary.passed, false);
  });
});
