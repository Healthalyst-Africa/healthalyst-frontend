// PostToolUse hook: formats the one file Claude just edited with this
// repository's Prettier, so formatting never reaches review. Lint, types and
// tests run in /healthalyst-sdlc:verify-change, the pre-push hook and CI.

import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

const FORMATTED_EXTENSIONS = new Set([
  ".js",
  ".cjs",
  ".mjs",
  ".jsx",
  ".ts",
  ".tsx",
  ".json",
  ".css",
  ".md",
  ".yml",
  ".yaml",
]);

function readHookInput() {
  try {
    return JSON.parse(readFileSync(0, "utf8"));
  } catch {
    return {};
  }
}

const hookInput = readHookInput();
const filePath = hookInput.tool_input?.file_path;
const projectDirectory =
  process.env.CLAUDE_PROJECT_DIR || hookInput.cwd || process.cwd();
const prettierEntry = path.join(
  projectDirectory,
  "node_modules",
  "prettier",
  "bin",
  "prettier.cjs"
);

const shouldFormat =
  typeof filePath === "string" &&
  FORMATTED_EXTENSIONS.has(path.extname(filePath).toLowerCase()) &&
  existsSync(filePath) &&
  existsSync(prettierEntry);

if (shouldFormat) {
  try {
    execFileSync(
      process.execPath,
      [prettierEntry, "--write", "--ignore-unknown", "--no-color", filePath],
      {
        cwd: projectDirectory,
        env: { ...process.env, FORCE_COLOR: "0" },
        stdio: ["ignore", "ignore", "pipe"],
      }
    );
  } catch (formatError) {
    // Exit code 2 shows the message to Claude: usually a syntax error to fix.
    process.stderr.write(
      `Prettier could not format ${filePath}:\n${formatError.stderr?.toString() ?? formatError.message}\n`
    );
    process.exit(2);
  }
}

process.exit(0);
