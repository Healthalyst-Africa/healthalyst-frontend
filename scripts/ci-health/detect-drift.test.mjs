import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, test } from "node:test";

import {
  calculateBaseline,
  calculateDailyFailureRates,
  classifyDrift,
  parseRuns,
  renderReport,
} from "./detect-drift.mjs";

const bands = JSON.parse(
  readFileSync(new URL("./control-bands.json", import.meta.url), "utf8")
);

function dailyRates(failureRates) {
  return failureRates.map((failureRate, dayIndex) => ({
    day: `2026-10-${String(dayIndex + 1).padStart(2, "0")}`,
    runs: 10,
    failures: Math.round(failureRate * 10),
    failureRate,
  }));
}

const STEADY_BASELINE = [
  0.1, 0.2, 0.1, 0.1, 0.2, 0.1, 0.1, 0.2, 0.1, 0.1, 0.2, 0.1,
];

describe("parseRuns and calculateDailyFailureRates", () => {
  test("counts failures per day and ignores cancelled runs and other events", () => {
    const runs = parseRuns(
      [
        '{"conclusion":"success","created_at":"2026-11-01T08:00:00Z","event":"push"}',
        '{"conclusion":"failure","created_at":"2026-11-01T09:00:00Z","event":"pull_request"}',
        '{"conclusion":"cancelled","created_at":"2026-11-01T10:00:00Z","event":"push"}',
        '{"conclusion":"failure","created_at":"2026-11-01T11:00:00Z","event":"schedule"}',
        '{"conclusion":"timed_out","created_at":"2026-11-02T08:00:00Z","event":"push"}',
        '{"conclusion":"success","created_at":"2026-11-02T09:00:00Z","event":"push"}',
        "",
      ].join("\n")
    );
    assert.deepEqual(calculateDailyFailureRates(runs, bands), [
      { day: "2026-11-01", runs: 2, failures: 1, failureRate: 0.5 },
      { day: "2026-11-02", runs: 2, failures: 1, failureRate: 0.5 },
    ]);
  });

  test("leaves out days with too few runs to mean anything", () => {
    const runs = parseRuns(
      '{"conclusion":"failure","created_at":"2026-11-03T08:00:00Z","event":"push"}'
    );
    assert.deepEqual(calculateDailyFailureRates(runs, bands), []);
  });
});

describe("calculateBaseline", () => {
  test("returns the mean and population standard deviation", () => {
    const baseline = calculateBaseline([0.1, 0.3]);
    assert.equal(baseline.mean, 0.2);
    assert.ok(Math.abs(baseline.standardDeviation - 0.1) < 1e-9);
  });
});

describe("classifyDrift", () => {
  test("waits for enough history before judging", () => {
    const classification = classifyDrift(dailyRates([0.1, 0.9, 0.9]), bands);
    assert.equal(classification.tier, 0);
    assert.match(classification.reasons[0], /Not enough history/);
  });

  test("a steady failure rate stays at tier 0", () => {
    const classification = classifyDrift(
      dailyRates([...STEADY_BASELINE, 0.1, 0.2, 0.1, 0.1, 0.1]),
      bands
    );
    assert.equal(classification.tier, 0);
  });

  test("a single high day is tier 3", () => {
    const classification = classifyDrift(
      dailyRates([...STEADY_BASELINE, 0.1, 0.1, 0.1, 0.1, 0.9]),
      bands
    );
    assert.equal(classification.tier, 3);
  });

  // The baseline mean is about 0.13 with the 0.05 minimum standard deviation,
  // so 0.25 is between two and three deviations and 0.2 between one and two.
  test("two of the last three days above two deviations is tier 2", () => {
    const classification = classifyDrift(
      dailyRates([...STEADY_BASELINE, 0.1, 0.1, 0.25, 0.25, 0.1]),
      bands
    );
    assert.equal(classification.tier, 2);
    assert.match(classification.reasons.join(" "), /Two of the last three/);
  });

  test("a slow drift over five days is tier 2", () => {
    const classification = classifyDrift(
      dailyRates([...STEADY_BASELINE, 0.2, 0.2, 0.2, 0.1, 0.2]),
      bands
    );
    assert.equal(classification.tier, 2);
    assert.match(classification.reasons.join(" "), /Four of the last five/);
  });

  test("one day above one deviation is only logged at tier 1", () => {
    const classification = classifyDrift(
      dailyRates([...STEADY_BASELINE, 0.1, 0.1, 0.1, 0.1, 0.2]),
      bands
    );
    assert.equal(classification.tier, 1);
  });

  test("a falling failure rate never raises an alert", () => {
    const classification = classifyDrift(
      dailyRates([...STEADY_BASELINE, 0, 0, 0, 0, 0]),
      bands
    );
    assert.equal(classification.tier, 0);
  });
});

describe("renderReport", () => {
  test("includes the tier, the reasons and the recent days", () => {
    const classification = classifyDrift(
      dailyRates([...STEADY_BASELINE, 0.1, 0.1, 0.1, 0.1, 0.9]),
      bands
    );
    const report = renderReport(classification, bands);
    assert.match(report, /tier 3/);
    assert.match(report, /\| 2026-10-17 \| 10 \| 9 \| 90\.0% \|/);
    assert.match(report, /review-incident/);
  });
});
