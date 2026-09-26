#!/usr/bin/env node
/**
 * Build guard: fail the build if internal filesystem paths or working-note
 * references would ship to the public site.
 *
 * Born 2026-08-30. Two live articles (worship-songs-for-ash-wednesday,
 * worship-songs-for-a-revival-service) were rendering a "_Sources:_" footer
 * naming vault paths like `01 - Projects/Worship Song Index/...` at the bottom
 * of the public page. Commit 0366b93 was titled "Remove public source footers"
 * and this regressed it anyway, because nothing enforced it.
 *
 * A convention that lives only in a commit message is invisible in both
 * directions: nothing can flag its violation and nothing can vouch for it.
 * This script is the enforcement.
 */

import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";

const ROOT = new URL("..", import.meta.url).pathname;

// Directories whose contents are rendered to the public site.
const SCAN_DIRS = ["src/content", "src/pages", "src/components", "public"];

// Only scan text we can meaningfully read.
const SCAN_EXT = new Set([".md", ".mdx", ".astro", ".json", ".html", ".ts", ".js", ".mjs"]);

// Things that must never reach a public page.
const FORBIDDEN = [
  { pattern: /01 - Projects/,            label: "vault project path" },
  { pattern: /\/Users\/[a-z]+\//i,       label: "absolute local filesystem path" },
  { pattern: /Obsidian Vault/,           label: "vault name" },
  { pattern: /CODEX_(BRIEF|COMPLETE|REVIEW)/, label: "internal handoff document" },
  { pattern: /Ankyr Shared Vault/,       label: "shared vault name" },
];

// Files that legitimately mention these strings and are not shipped as content.
const ALLOWLIST = new Set([
  "scripts/check-no-internal-leaks.mjs",
]);

function walk(dir, out = []) {
  let entries;
  try {
    entries = readdirSync(dir);
  } catch {
    return out;
  }
  for (const entry of entries) {
    if (entry === "node_modules" || entry.startsWith(".")) continue;
    const full = join(dir, entry);
    const st = statSync(full);
    if (st.isDirectory()) walk(full, out);
    else if (SCAN_EXT.has(entry.slice(entry.lastIndexOf(".")))) out.push(full);
  }
  return out;
}

const violations = [];

for (const dir of SCAN_DIRS) {
  for (const file of walk(join(ROOT, dir))) {
    const rel = relative(ROOT, file);
    if (ALLOWLIST.has(rel)) continue;

    const text = readFileSync(file, "utf8");
    const lines = text.split("\n");

    for (const { pattern, label } of FORBIDDEN) {
      lines.forEach((line, i) => {
        if (pattern.test(line)) {
          violations.push({
            file: rel,
            line: i + 1,
            label,
            excerpt: line.trim().slice(0, 160),
          });
        }
      });
    }
  }
}

if (violations.length > 0) {
  console.error("\n[31m✖ Internal path leak detected — build halted.[0m\n");
  console.error("These strings must never ship to the public site:\n");
  for (const v of violations) {
    console.error(`  ${v.file}:${v.line}  [${v.label}]`);
    console.error(`    ${v.excerpt}\n`);
  }
  console.error(`${violations.length} violation(s). Remove them, then rebuild.\n`);
  process.exit(1);
}

console.log("✓ No internal path leaks found.");
