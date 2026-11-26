// Calculates the five DORA software delivery measures from GitHub data.
// They are approximations sized for a small team and are meant to start a
// conversation about how work flows, never to be used as targets.
//
// Definitions:
// - Deployment frequency: release records (one per push to main, which
//   Vercel deploys) per week.
// - Change lead time: median hours from a pull request into dev being opened
//   to the first release published after it merged.
// - Change fail rate: share of releases followed by an issue labelled
//   "incident" before the next release.
// - Failed deployment recovery time: median hours from an incident issue
//   being opened to it being closed.
// - Deployment rework rate: share of releases whose pull requests are all
//   unplanned work (titles starting with fix, revert or hotfix).
//
//   node scripts/delivery-metrics/measure-delivery.mjs --releases releases.json \
//     --pull-requests pull-requests.json --incidents incidents.json \
//     [--days 90] [--summary "$GITHUB_STEP_SUMMARY"]

import { appendFileSync, readFileSync } from "node:fs";

import {
  isDirectlyExecuted,
  readCommandLineOptions,
} from "../command-line-options.mjs";

const HOUR_IN_MILLISECONDS = 60 * 60 * 1000;
const DAY_IN_MILLISECONDS = 24 * HOUR_IN_MILLISECONDS;
const UNPLANNED_WORK_PATTERN = /^(fix|revert|hotfix)\b/i;

export function median(values) {
  if (values.length === 0) return null;
  const sortedValues = [...values].sort(
    (firstValue, secondValue) => firstValue - secondValue
  );
  const middleIndex = Math.floor(sortedValues.length / 2);
  return sortedValues.length % 2 === 0
    ? (sortedValues[middleIndex - 1] + sortedValues[middleIndex]) / 2
    : sortedValues[middleIndex];
}

export function measureDelivery({
  releases,
  pullRequests,
  incidents,
  measuredDays,
  now,
}) {
  const periodStart = now.getTime() - measuredDays * DAY_IN_MILLISECONDS;
  const publishedReleases = releases
    .filter((release) => !release.isDraft && release.publishedAt)
    .map((release) => ({
      tagName: release.tagName,
      publishedAt: new Date(release.publishedAt).getTime(),
    }))
    .sort(
      (firstRelease, secondRelease) =>
        firstRelease.publishedAt - secondRelease.publishedAt
    );
  const periodReleases = publishedReleases.filter(
    (release) =>
      release.publishedAt >= periodStart && release.publishedAt <= now.getTime()
  );

  const findFirstReleaseAfter = (moment) =>
    publishedReleases.find((release) => release.publishedAt >= moment);

  const pullRequestsByRelease = new Map();
  const leadTimeHours = [];
  for (const pullRequest of pullRequests) {
    if (!pullRequest.mergedAt) continue;
    const mergedAt = new Date(pullRequest.mergedAt).getTime();
    const release = findFirstReleaseAfter(mergedAt);
    if (!release || release.publishedAt < periodStart) continue;
    leadTimeHours.push(
      (release.publishedAt - new Date(pullRequest.createdAt).getTime()) /
        HOUR_IN_MILLISECONDS
    );
    const releasePullRequests =
      pullRequestsByRelease.get(release.tagName) ?? [];
    releasePullRequests.push(pullRequest);
    pullRequestsByRelease.set(release.tagName, releasePullRequests);
  }

  const incidentOpenings = incidents.map((incident) =>
    new Date(incident.createdAt).getTime()
  );
  const failedReleases = periodReleases.filter((release) => {
    const releaseIndex = publishedReleases.indexOf(release);
    const nextRelease = publishedReleases[releaseIndex + 1];
    const windowEnd = nextRelease ? nextRelease.publishedAt : now.getTime();
    return incidentOpenings.some(
      (openedAt) => openedAt >= release.publishedAt && openedAt < windowEnd
    );
  });

  const recoveryHours = incidents
    .filter(
      (incident) =>
        incident.closedAt &&
        new Date(incident.createdAt).getTime() >= periodStart
    )
    .map(
      (incident) =>
        (new Date(incident.closedAt).getTime() -
          new Date(incident.createdAt).getTime()) /
        HOUR_IN_MILLISECONDS
    );

  const releasesWithPullRequests = periodReleases.filter((release) =>
    pullRequestsByRelease.has(release.tagName)
  );
  const reworkReleases = releasesWithPullRequests.filter((release) =>
    pullRequestsByRelease
      .get(release.tagName)
      .every((pullRequest) => UNPLANNED_WORK_PATTERN.test(pullRequest.title))
  );

  const share = (part, whole) => (whole === 0 ? null : part / whole);
  return {
    measuredDays,
    releaseCount: periodReleases.length,
    deploymentsPerWeek: periodReleases.length / (measuredDays / 7),
    changeLeadTimeHours: median(leadTimeHours),
    changeFailRate: share(failedReleases.length, periodReleases.length),
    recoveryTimeHours: median(recoveryHours),
    reworkRate: share(reworkReleases.length, releasesWithPullRequests.length),
  };
}

const formatHours = (hours) =>
  hours === null
    ? "No data"
    : hours >= 48
      ? `${(hours / 24).toFixed(1)} days`
      : `${hours.toFixed(1)} hours`;
const formatShare = (value) =>
  value === null ? "No data" : `${(value * 100).toFixed(0)}%`;

export function renderSummary(measures) {
  return [
    `## Delivery measures for the last ${measures.measuredDays} days`,
    "",
    "| Measure | Value |",
    "| --- | --- |",
    `| Deployment frequency | ${measures.deploymentsPerWeek.toFixed(1)} per week (${measures.releaseCount} releases) |`,
    `| Change lead time (median) | ${formatHours(measures.changeLeadTimeHours)} |`,
    `| Change fail rate | ${formatShare(measures.changeFailRate)} |`,
    `| Failed deployment recovery time (median) | ${formatHours(measures.recoveryTimeHours)} |`,
    `| Deployment rework rate | ${formatShare(measures.reworkRate)} |`,
    "",
    "Definitions are at the top of scripts/delivery-metrics/measure-delivery.mjs.",
    "",
  ].join("\n");
}

function main() {
  const options = readCommandLineOptions(process.argv.slice(2));
  const requiredFiles = ["releases", "pull-requests", "incidents"];
  if (requiredFiles.some((option) => typeof options[option] !== "string")) {
    console.error(
      "Usage: measure-delivery.mjs --releases <file> --pull-requests <file> --incidents <file> [--days 90]"
    );
    process.exit(1);
  }
  const measuredDays = Number.parseInt(String(options.days ?? "90"), 10);
  if (
    !Number.isInteger(measuredDays) ||
    measuredDays < 7 ||
    measuredDays > 730
  ) {
    console.error("--days must be a whole number from 7 to 730.");
    process.exit(1);
  }
  const readJson = (filePath) => JSON.parse(readFileSync(filePath, "utf8"));
  const summary = renderSummary(
    measureDelivery({
      releases: readJson(options.releases),
      pullRequests: readJson(options["pull-requests"]),
      incidents: readJson(options.incidents),
      measuredDays,
      now: new Date(),
    })
  );
  process.stdout.write(summary);
  if (typeof options.summary === "string")
    appendFileSync(options.summary, summary);
}

if (isDirectlyExecuted(import.meta.url)) {
  main();
}
