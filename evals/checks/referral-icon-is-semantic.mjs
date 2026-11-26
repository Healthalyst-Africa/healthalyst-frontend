// Check for the icons-get-semantic-names eval: @healthalyst/icons exports a
// referral icon under a semantic name ending in "Icon", and no application
// imports the icon vendor directly (lint also enforces the second part).
import { readFileSync } from "node:fs";

const iconExports = readFileSync("packages/icons/src/index.ts", "utf8");
if (!/\bReferral\w*Icon\b/.test(iconExports)) {
  console.error(
    "packages/icons/src/index.ts has no semantic export such as ReferralSentIcon."
  );
  process.exit(1);
}
console.log("@healthalyst/icons exports a semantic referral icon.");
