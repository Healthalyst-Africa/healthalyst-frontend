// Compares the daily Client CI failure rate with its own rolling baseline.
// Detection is deliberately plain arithmetic (mean, standard deviation and
// Western Electric run rules) so that whether to raise an alert never depends
// on a model. Claude is only asked to diagnose after this script decides.
//
//   node scripts/ci-health/detect-drift.mjs --runs ci-runs.jsonl \
//     --bands scripts/ci-health/control-bands.json [--report report.md] \
//     [--summary "$GITHUB_STEP_SUMMARY"] [--output "$GITHUB_OUTPUT"]

import { appendFileSync, readFileSync, writeFileSync } from "node:fs";

import {
  isDirectlyExecuted,
  readCommandLineOptions,
} from "../command-line-options.mjs";

export function parseRuns(jsonLines) {
  return jsonLines
    .split(/\r?\n/)
    .filter((line) => line.trim() !== "")
    .map((line) => {
      const run = JSON.parse(line);
      return {
        conclusion: run.conclusion,
        createdAt: run.created_at ?? run.createdAt,
        event: run.event,
      };
    });
}

export function calculateDailyFailureRates(runs, bands) {
  const countedConclusions = new Set(bands.countedConclusions);
  const failedConclusions = new Set(bands.failedConclusions);
  const countedEvents = new Set(bands.events);
  const days = new Map();

  for (const run of runs) {
    if (
      !countedEvents.has(run.event) ||
      !countedConclusions.has(run.conclusion)
    )
      continue;
    const day = String(run.createdAt).slice(0, 10);
    const totals = days.get(day) ?? { runs: 0, failures: 0 };
    totals.runs += 1;
    if (failedConclusions.has(run.conclusion)) totals.failures += 1;
    days.set(day, totals);
  }

  return [...days.entries()]
    .filter(([, totals]) => totals.runs >= bands.minimumRunsPerDay)
    .sort(([firstDay], [secondDay]) => firstDay.localeCompare(secondDay))
    .map(([day, totals]) => ({
      day,
      runs: totals.runs,
      failures: totals.failures,
      failureRate: totals.failures / totals.runs,
    }));
}

export function calculateBaseline(values) {
  const mean =
    values.reduce((total, value) => total + value, 0) / values.length;
  const variance =
    values.reduce((total, value) => total + (value - mean) ** 2, 0) /
    values.length;
  return { mean, standardDeviation: Math.sqrt(variance) };
}

export function classifyDrift(dailyRates, bands) {
  const recentPoints = dailyRates.slice(-bands.recentDays);
  const baselinePoints = dailyRates
    .slice(0, Math.max(0, dailyRates.length - bands.recentDays))
    .slice(-bands.baselineDays);

  if (
    recentPoints.length === 0 ||
    baselinePoints.length < bands.minimumBaselineDays
  ) {
    return {
      tier: 0,
      reasons: [
        `Not enough history yet: ${baselinePoints.length} baseline days, ${bands.minimumBaselineDays} needed.`,
      ],
      recentPoints,
      baseline: null,
    };
  }

  const measuredBaseline = calculateBaseline(
    baselinePoints.map((point) => point.failureRate)
  );
  const baseline = {
    ...measuredBaseline,
    standardDeviation: Math.max(
      measuredBaseline.standardDeviation,
      bands.minimumStandardDeviation
    ),
  };
  const scoredPoints = recentPoints.map((point) => ({
    ...point,
    deviations:
      (point.failureRate - baseline.mean) / baseline.standardDeviation,
  }));
  const latestPoint = scoredPoints.at(-1);
  const lastThree = scoredPoints.slice(-3);
  const lastFive = scoredPoints.slice(-5);
  const countAbove = (points, threshold) =>
    points.filter((point) => point.deviations >= threshold).length;

  const signals = [];
  if (latestPoint.deviations >= 3) {
    signals.push({
      tier: 3,
      reason: `The latest day (${latestPoint.day}) is three or more standard deviations above the baseline.`,
    });
  }
  if (latestPoint.deviations >= 2) {
    signals.push({
      tier: 2,
      reason: `The latest day (${latestPoint.day}) is two or more standard deviations above the baseline.`,
    });
  }
  if (lastThree.length === 3 && countAbove(lastThree, 2) >= 2) {
    signals.push({
      tier: 2,
      reason:
        "Two of the last three days are two or more standard deviations above the baseline.",
    });
  }
  if (lastFive.length === 5 && countAbove(lastFive, 1) >= 4) {
    signals.push({
      tier: 2,
      reason:
        "Four of the last five days are one or more standard deviations above the baseline.",
    });
  }
  if (latestPoint.deviations >= 1) {
    signals.push({
      tier: 1,
      reason: `The latest day (${latestPoint.day}) is one or more standard deviations above the baseline.`,
    });
  }

  const tier = Math.max(0, ...signals.map((signal) => signal.tier));
  return {
    tier,
    reasons:
      signals.length > 0
        ? signals.map((signal) => signal.reason)
        : ["Within the usual range."],
    recentPoints: scoredPoints,
    baseline,
  };
}

const formatPercentage = (value) => `${(value * 100).toFixed(1)}%`;

export function renderReport(classification, bands) {
  const lines = [
    `## ${bands.metric}: tier ${classification.tier}`,
    "",
    bands.tiers[String(classification.tier)],
    "",
    ...classification.reasons.map((reason) => `- ${reason}`),
    "",
  ];
  if (classification.baseline) {
    lines.push(
      `Baseline: mean ${formatPercentage(classification.baseline.mean)}, standard deviation ${formatPercentage(classification.baseline.standardDeviation)}.`,
      "",
      "| Day | Runs | Failures | Failure rate | Standard deviations |",
      "| --- | ---: | ---: | ---: | ---: |",
      ...classification.recentPoints.map(
        (point) =>
          `| ${point.day} | ${point.runs} | ${point.failures} | ${formatPercentage(point.failureRate)} | ${point.deviations.toFixed(1)} |`
      ),
      ""
    );
  }
  lines.push(
    "Next step: run `/healthalyst-sdlc:review-incident` on this issue, or close it with the reason if the rise is understood."
  );
  return `${lines.join("\n")}\n`;
}

function main() {
  const options = readCommandLineOptions(process.argv.slice(2));
  if (typeof options.runs !== "string" || typeof options.bands !== "string") {
    console.error(
      "Usage: detect-drift.mjs --runs <file.jsonl> --bands <control-bands.json>"
    );
    process.exit(1);
  }
  const bands = JSON.parse(readFileSync(options.bands, "utf8"));
  const runs = parseRuns(readFileSync(options.runs, "utf8"));
  const classification = classifyDrift(
    calculateDailyFailureRates(runs, bands),
    bands
  );
  const report = renderReport(classification, bands);

  process.stdout.write(report);
  if (typeof options.report === "string") writeFileSync(options.report, report);
  if (typeof options.summary === "string")
    appendFileSync(options.summary, report);
  if (typeof options.output === "string") {
    appendFileSync(options.output, `tier=${classification.tier}\n`);
  }
}

if (isDirectlyExecuted(import.meta.url)) {
  main();
}
