// Guards the branch rules decided in issue #66 and recorded in
// docs/changes/66-keep-branches-up-to-date/plan.md. A pull request into dev
// can only merge once its branch includes the latest dev; main, which only
// ever takes dev, does not require this. Both rulesets stay enforced, and the
// pre-push hook never changes branches, because Git has already chosen what
// to push before the hook runs.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, test } from "node:test";

const CHANGE_RECORD = "docs/changes/66-keep-branches-up-to-date/plan.md";
const CORE_RULE_TYPES = [
  "deletion",
  "non_fast_forward",
  "pull_request",
  "required_status_checks",
  "code_scanning",
];
const BRANCH_CHANGING_COMMAND =
  /\bgit(?:\s+-[cC]\s+\S+|\s+--?[\w-]+(?:=\S+)?)*\s+(?:pull|merge|rebase|reset|checkout|switch|stash)\b/;

function readRepositoryFile(relativePath) {
  return readFileSync(
    new URL(`../../${relativePath}`, import.meta.url),
    "utf8"
  );
}

function readRuleset(fileName) {
  return JSON.parse(readRepositoryFile(`.github/settings/${fileName}`));
}

function findRequiredStatusChecks(ruleset) {
  const rule = ruleset.rules.find(
    (candidateRule) => candidateRule.type === "required_status_checks"
  );
  assert.ok(rule, `"${ruleset.name}" has no required status checks rule`);
  return rule.parameters;
}

function findBranchChangingCommand(hookText) {
  const commandLines = hookText
    .split(/\r?\n/)
    .filter((line) => !line.trim().startsWith("#"))
    .join("\n");
  return commandLines.match(BRANCH_CHANGING_COMMAND)?.[0] ?? null;
}

const integrationBranchRuleset = readRuleset("ruleset-dev.json");
const productionBranchRuleset = readRuleset("ruleset-main.json");
const rulesets = [integrationBranchRuleset, productionBranchRuleset];

describe("branch rulesets", () => {
  test("pull requests into dev must include the latest dev before merging", () => {
    assert.equal(
      findRequiredStatusChecks(integrationBranchRuleset)
        .strict_required_status_checks_policy,
      true,
      `"${integrationBranchRuleset.name}" must require branches to be up to date before merging`
    );
  });

  test("main does not require up-to-date branches, because it only takes dev", () => {
    assert.equal(
      findRequiredStatusChecks(productionBranchRuleset)
        .strict_required_status_checks_policy,
      false,
      `"${productionBranchRuleset.name}" was kept off on purpose; change the decision in ${CHANGE_RECORD} first`
    );
  });

  test("both branches still require the verify and Dependency review checks", () => {
    for (const ruleset of rulesets) {
      const checkNames = findRequiredStatusChecks(ruleset)
        .required_status_checks.map((check) => check.context)
        .sort();
      assert.deepEqual(
        checkNames,
        ["Dependency review", "verify"],
        ruleset.name
      );
    }
  });

  test("both rulesets stay enforced, with no way around a pull request", () => {
    for (const ruleset of rulesets) {
      assert.equal(
        ruleset.enforcement,
        "active",
        `"${ruleset.name}" must be enforced`
      );
      for (const bypassActor of ruleset.bypass_actors) {
        assert.equal(
          bypassActor.bypass_mode,
          "pull_request",
          `"${ruleset.name}" may only be bypassed through a pull request`
        );
      }
      const ruleTypes = ruleset.rules.map((rule) => rule.type);
      for (const coreRuleType of CORE_RULE_TYPES) {
        assert.ok(
          ruleTypes.includes(coreRuleType),
          `"${ruleset.name}" is missing its ${coreRuleType} rule`
        );
      }
    }
  });
});

describe("pre-push hook", () => {
  test("the guard recognises commands that change branches", () => {
    for (const hookText of [
      "git pull origin main && pnpm build",
      "git -C . pull",
      "git -c pull.rebase=true pull",
      "git --no-pager merge origin/dev",
      "pnpm build\ngit rebase origin/dev",
    ]) {
      assert.notEqual(findBranchChangingCommand(hookText), null, hookText);
    }
    for (const hookText of [
      "pnpm build",
      "git fetch origin && pnpm build",
      "# never run git pull here\npnpm build",
    ]) {
      assert.equal(findBranchChangingCommand(hookText), null, hookText);
    }
  });

  test("never changes branches while pushing", () => {
    const branchChangingCommand = findBranchChangingCommand(
      readRepositoryFile(".husky/pre-push")
    );
    assert.equal(
      branchChangingCommand,
      null,
      `The pre-push hook runs "${branchChangingCommand}", but what it changes is not pushed; update the branch before pushing instead`
    );
  });

  test("still builds before pushing", () => {
    assert.match(readRepositoryFile(".husky/pre-push"), /\bpnpm build\b/);
  });
});
