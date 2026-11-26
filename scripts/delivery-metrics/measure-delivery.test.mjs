import assert from "node:assert/strict";
import { describe, test } from "node:test";

import { measureDelivery, median, renderSummary } from "./measure-delivery.mjs";

const NOW = new Date("2026-11-30T12:00:00Z");

const releases = [
  {
    tagName: "v2026.11.02.1",
    publishedAt: "2026-11-02T12:00:00Z",
    isDraft: false,
  },
  {
    tagName: "v2026.11.09.1",
    publishedAt: "2026-11-09T12:00:00Z",
    isDraft: false,
  },
  {
    tagName: "v2026.11.16.1",
    publishedAt: "2026-11-16T12:00:00Z",
    isDraft: false,
  },
  {
    tagName: "v2026.11.23.1",
    publishedAt: "2026-11-23T12:00:00Z",
    isDraft: false,
  },
  { tagName: "draft", publishedAt: null, isDraft: true },
];

const pullRequests = [
  {
    number: 1,
    title: "feat: booking",
    createdAt: "2026-11-01T12:00:00Z",
    mergedAt: "2026-11-02T00:00:00Z",
  },
  {
    number: 2,
    title: "feat: billing",
    createdAt: "2026-11-07T12:00:00Z",
    mergedAt: "2026-11-08T12:00:00Z",
  },
  {
    number: 3,
    title: "fix: billing totals",
    createdAt: "2026-11-15T12:00:00Z",
    mergedAt: "2026-11-16T00:00:00Z",
  },
  {
    number: 4,
    title: "feat: triage",
    createdAt: "2026-11-21T12:00:00Z",
    mergedAt: "2026-11-22T12:00:00Z",
  },
  {
    number: 5,
    title: "feat: not released yet",
    createdAt: "2026-11-28T12:00:00Z",
    mergedAt: "2026-11-29T12:00:00Z",
  },
];

const incidents = [
  {
    number: 40,
    createdAt: "2026-11-10T12:00:00Z",
    closedAt: "2026-11-10T18:00:00Z",
  },
];

describe("median", () => {
  test("handles odd, even and empty lists", () => {
    assert.equal(median([3, 1, 2]), 2);
    assert.equal(median([4, 1, 2, 3]), 2.5);
    assert.equal(median([]), null);
  });
});

describe("measureDelivery", () => {
  const measures = measureDelivery({
    releases,
    pullRequests,
    incidents,
    measuredDays: 28,
    now: NOW,
  });

  test("counts published releases in the period", () => {
    assert.equal(measures.releaseCount, 4);
    assert.equal(measures.deploymentsPerWeek, 1);
  });

  test("measures lead time from opening a pull request to its release", () => {
    // Lead times: 24, 48, 24 and 48 hours. The unreleased pull request is ignored.
    assert.equal(measures.changeLeadTimeHours, 36);
  });

  test("a release followed by an incident before the next release has failed", () => {
    assert.equal(measures.changeFailRate, 0.25);
  });

  test("recovery time runs from an incident opening to its closing", () => {
    assert.equal(measures.recoveryTimeHours, 6);
  });

  test("a release made only of fixes is rework", () => {
    assert.equal(measures.reworkRate, 0.25);
  });

  test("an empty history reports no data instead of zero", () => {
    const emptyMeasures = measureDelivery({
      releases: [],
      pullRequests: [],
      incidents: [],
      measuredDays: 28,
      now: NOW,
    });
    assert.equal(emptyMeasures.changeFailRate, null);
    assert.match(renderSummary(emptyMeasures), /Change fail rate \| No data/);
  });
});
