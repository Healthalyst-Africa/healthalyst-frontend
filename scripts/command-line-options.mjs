// Shared helpers for the repository's command-line scripts.

import path from "node:path";
import { fileURLToPath } from "node:url";

// Reads "--name value" pairs and bare "--flag" switches.
export function readCommandLineOptions(commandLineArguments) {
  const options = {};
  for (
    let argumentIndex = 0;
    argumentIndex < commandLineArguments.length;
    argumentIndex += 1
  ) {
    const argument = commandLineArguments[argumentIndex];
    if (!argument.startsWith("--")) continue;
    const optionName = argument.slice(2);
    const nextArgument = commandLineArguments[argumentIndex + 1];
    if (nextArgument === undefined || nextArgument.startsWith("--")) {
      options[optionName] = true;
    } else {
      options[optionName] = nextArgument;
      argumentIndex += 1;
    }
  }
  return options;
}

// True when the module was run with `node <file>` rather than imported.
export function isDirectlyExecuted(moduleAddress) {
  return (
    process.argv[1] !== undefined &&
    path.resolve(process.argv[1]) === fileURLToPath(moduleAddress)
  );
}
