import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { afterEach, describe, expect, it, vi } from "vitest";
import { HEALTH_SCHEDULE_ROUTES } from "~/config/routes";
import {
  GUIDED_TOURS,
  hasGuidedTour,
} from "~/features/guided-tours/config/guided-tours";
import { PAGE_GUIDES } from "~/features/guided-tours/config/page-guides";
import { findPage } from "~/features/guided-tours/utilities/page-tour";
import {
  hasAnsweredTourOffer,
  rememberTourOfferAnswer,
} from "~/features/guided-tours/utilities/tour-offer-memory";

const SOURCE_FOLDERS = [
  fileURLToPath(new URL("../../../", import.meta.url)),
  fileURLToPath(new URL("../../../../../../packages/ui/src", import.meta.url)),
];

function readSourceFiles(folder: string): string[] {
  return readdirSync(folder).flatMap((entry) => {
    const path = join(folder, entry);
    if (statSync(path).isDirectory()) return readSourceFiles(path);
    return path.endsWith(".tsx") ? [readFileSync(path, "utf8")] : [];
  });
}

describe("page help", () => {
  it.each([
    ["/", "workspace"],
    ["/front-desk", "frontDesk"],
    ["/queues", "queues"],
    ["/triage", "triage"],
    ["/consultation", "consultation"],
    ["/patients", "patients"],
    ["/patients/0f6b4c2a-1d3e-4f5a-8b7c-9d0e1f2a3b4c", "patientRecord"],
    ["/access-reviews", "accessReviews"],
    ["/schedule/calendars", "scheduleCalendars"],
    ["/somewhere-else", null],
  ])("finds the page at %s", (pathname, page) => {
    expect(findPage(pathname)).toBe(page);
  });

  it("explains every HealthSchedule page", () => {
    const fixedRoutes = Object.values(HEALTH_SCHEDULE_ROUTES).flatMap(
      (route) => (typeof route === "string" ? [route] : [])
    );
    expect(fixedRoutes.filter((route) => findPage(route) === null)).toEqual([]);
    expect(findPage(HEALTH_SCHEDULE_ROUTES.patient("any-patient"))).toBe(
      "patientRecord"
    );
  });

  it("keeps each guide short", () => {
    for (const guide of Object.values(PAGE_GUIDES)) {
      expect(guide.paragraphs.length).toBeLessThanOrEqual(3);
    }
  });

  it("offers a tour only on pages that have one", () => {
    expect(hasGuidedTour("consultation")).toBe(true);
    expect(hasGuidedTour("accessReviews")).toBe(false);
  });

  it("keeps every tour short", () => {
    for (const tour of Object.values(GUIDED_TOURS)) {
      expect(tour.steps.length).toBeLessThanOrEqual(5);
    }
  });

  it("points only at elements that exist in the source", () => {
    const source = SOURCE_FOLDERS.flatMap(readSourceFiles).join("\n");
    const anchors = Object.values(GUIDED_TOURS).flatMap((tour) =>
      tour.steps.flatMap((step) =>
        "element" in step && step.element ? [step.element] : []
      )
    );
    const missing = anchors.filter((selector) => {
      const name = /\[data-tour="([^"]+)"\]/.exec(selector)?.[1];
      return !name || !source.includes(`data-tour="${name}"`);
    });
    expect(missing).toEqual([]);
  });
});

describe("the tour offer", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("remembers the answer per person", () => {
    const stored = new Map<string, string>();
    vi.stubGlobal("window", {
      localStorage: {
        getItem: (name: string) => stored.get(name) ?? null,
        setItem: (name: string, value: string) => stored.set(name, value),
      },
    });
    expect(hasAnsweredTourOffer("person-1")).toBe(false);
    rememberTourOfferAnswer("person-1", "declined");
    expect(hasAnsweredTourOffer("person-1")).toBe(true);
    expect(hasAnsweredTourOffer("person-2")).toBe(false);
  });

  it("carries on when storage is unavailable", () => {
    vi.stubGlobal("window", {
      localStorage: {
        getItem: () => {
          throw new Error("Storage is blocked");
        },
        setItem: () => {
          throw new Error("Storage is blocked");
        },
      },
    });
    expect(hasAnsweredTourOffer("person-1")).toBe(false);
    expect(() => rememberTourOfferAnswer("person-1", "taken")).not.toThrow();
  });
});
