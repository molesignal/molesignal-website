/**
 * EN ↔ ZH key parity check. The two message bundles must share the exact
 * same shape; any drift breaks `useTranslations` calls in one locale
 * silently.
 *
 * Exits 1 on any difference and prints the missing keys per locale.
 */
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HERE, "..", "messages");

type Json = { [k: string]: string | Json };

function loadMessages(file: string): Json {
  return JSON.parse(readFileSync(resolve(ROOT, file), "utf8"));
}

function flatten(obj: Json, prefix = ""): string[] {
  const keys: string[] = [];
  for (const [k, v] of Object.entries(obj)) {
    const path = prefix ? `${prefix}.${k}` : k;
    if (typeof v === "string") {
      keys.push(path);
    } else {
      keys.push(...flatten(v, path));
    }
  }
  return keys;
}

const en = loadMessages("en.json");
const zh = loadMessages("zh.json");
const enKeys = new Set(flatten(en));
const zhKeys = new Set(flatten(zh));

const missingInZh = [...enKeys].filter((k) => !zhKeys.has(k)).sort();
const missingInEn = [...zhKeys].filter((k) => !enKeys.has(k)).sort();

console.log("\ni18n parity audit — EN ↔ ZH\n");
console.log(`EN keys: ${enKeys.size}`);
console.log(`ZH keys: ${zhKeys.size}`);

if (missingInZh.length > 0) {
  console.log(`\nMissing in zh.json (${missingInZh.length}):`);
  for (const k of missingInZh) console.log(`  - ${k}`);
}

if (missingInEn.length > 0) {
  console.log(`\nMissing in en.json (${missingInEn.length}):`);
  for (const k of missingInEn) console.log(`  - ${k}`);
}

if (missingInZh.length === 0 && missingInEn.length === 0) {
  console.log("\nKey parity: OK.");
  process.exit(0);
}
console.error("\ni18n keys are out of sync.");
process.exit(1);
