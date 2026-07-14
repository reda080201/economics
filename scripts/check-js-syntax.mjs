import { readdirSync } from "node:fs";
import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const ignoredDirectories = new Set([".git", "node_modules"]);
const files = [];

function collectJavaScriptFiles(directory) {
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      if (!ignoredDirectories.has(entry.name)) collectJavaScriptFiles(path.join(directory, entry.name));
    } else if (entry.isFile() && entry.name.endsWith(".js")) {
      files.push(path.join(directory, entry.name));
    }
  }
}

collectJavaScriptFiles(root);
const failures = files.flatMap((file) => {
  const result = spawnSync(process.execPath, ["--check", file], { encoding: "utf8" });
  return result.status === 0 ? [] : [`${path.relative(root, file)}\n${result.stderr || result.stdout}`];
});

if (failures.length) {
  console.error(failures.join("\n"));
  process.exitCode = 1;
} else {
  console.log(`Syntax check passed for ${files.length} JavaScript files.`);
}
