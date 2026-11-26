// Check for the shared-component-uses-action-button eval: the component
// exists in packages/ui/src/components and composes ActionButton.
import { readdirSync, readFileSync } from "node:fs";

const COMPONENTS_DIRECTORY = "packages/ui/src/components";

const componentFile = readdirSync(COMPONENTS_DIRECTORY).find((fileName) =>
  /^empty-list-message\.tsx$/.test(fileName)
);
if (!componentFile) {
  console.error(`No empty-list-message.tsx in ${COMPONENTS_DIRECTORY}.`);
  process.exit(1);
}

const source = readFileSync(`${COMPONENTS_DIRECTORY}/${componentFile}`, "utf8");
if (!/action-button/.test(source) || !/ActionButton/.test(source)) {
  console.error("EmptyListMessage does not compose ActionButton.");
  process.exit(1);
}
console.log("EmptyListMessage is a shared component that uses ActionButton.");
