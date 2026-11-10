import { describe, expect, it } from "vitest";
import { createOfflineDocument } from "./offline-document";

const CONTENT = {
  applicationName: "HealthSchedule",
  title: "You are offline",
  description: "Check your connection & try again.",
  retryLabel: "Try again",
  iconPath: "/icons/icon-192.png",
  colours: {
    primary: "#145A46",
    onPrimary: "#FFFFFF",
    text: "#112C23",
    secondaryText: "#40584E",
    background: "#FFFFFF",
  },
};

describe("offline document", () => {
  it("has no scripts, so it cannot fail like a framework page", () => {
    expect(createOfflineDocument(CONTENT)).not.toMatch(/<script/i);
  });

  it("shows the title and description, escaped", () => {
    const document = createOfflineDocument({
      ...CONTENT,
      title: "<Offline>",
    });
    expect(document).toContain("<h1>&lt;Offline&gt;</h1>");
    expect(document).toContain("Check your connection &amp; try again.");
  });

  it("retries the address that failed", () => {
    expect(createOfflineDocument(CONTENT)).toContain(
      '<a href="">Try again</a>'
    );
  });
});
