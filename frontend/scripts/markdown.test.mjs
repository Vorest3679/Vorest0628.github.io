import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { fileURLToPath } from "node:url";
import { test } from "vite-plus/test";

const execFileAsync = promisify(execFile);

test("Markdown math and tables retain their rendering behavior", async () => {
  await execFileAsync(process.execPath, [
    fileURLToPath(new URL("./markdown-test.mjs", import.meta.url)),
  ]);
}, 30_000);
