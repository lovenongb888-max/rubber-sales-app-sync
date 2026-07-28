import { readFile } from "node:fs/promises";
import path from "node:path";

import "./load-env.js";
import { storagePut } from "../server/storage";

async function main() {
  const source = path.resolve("/home/ubuntu/webdev-static-assets/rubber-app-icon.png");
  const logo = await readFile(source);
  const result = await storagePut("rubber-assets/rubber-app-icon.png", logo, "image/png");
  process.stdout.write(`${result.url}\n`);
}

main().catch((error: unknown) => {
  process.stderr.write(`${error instanceof Error ? error.stack : String(error)}\n`);
  process.exitCode = 1;
});
