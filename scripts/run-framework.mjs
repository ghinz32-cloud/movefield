import { spawnSync } from "node:child_process";
import {rmSync} from "node:fs";
import { fileURLToPath } from "node:url";
import { readExecutionProfile } from "./execution-profile.mjs";

const [command, ...args] = process.argv.slice(2);
if (!["dev", "build"].includes(command)) throw new Error("Expected dev or build.");
// Reproducible browser-only worker assets, including on a fresh checkout.
const modelWorker = spawnSync(process.execPath, [
  fileURLToPath(new URL("../node_modules/vite/bin/vite.js", import.meta.url)),
  "build", "--config", fileURLToPath(new URL("../build/qwen-worker.config.mjs", import.meta.url)),
], {stdio: "inherit"});
if (modelWorker.error) throw modelWorker.error;
if (modelWorker.status !== 0) throw new Error("The optional Qwen worker could not be built.");
// The downloadable starter must match the current native source, not an old ZIP.
const starter = spawnSync("python3", [fileURLToPath(new URL("./package-mobile.py", import.meta.url))], {stdio: "inherit"});
if (starter.error) throw starter.error;
if (starter.status !== 0) throw new Error("The mobile source starter could not be packaged.");
const managedLinux = readExecutionProfile() === "managed-linux";

if (command === "build") {
  // Remove generated output so server/client copy stages cannot retain obsolete chunks.
  rmSync(fileURLToPath(new URL("../dist/",import.meta.url)),{recursive:true,force:true});
  // Finalize both execution profiles after the framework's successful build.
  // Importing its CLI in this process can exit before offline finalization.
  const result = managedLinux
    ? spawnSync("bash", [fileURLToPath(new URL("./build-verified.sh", import.meta.url)), ...args], {stdio: "inherit"})
    : spawnSync(process.execPath, [fileURLToPath(new URL("../node_modules/vinext/dist/cli.js", import.meta.url)), "build", ...args], {stdio: "inherit"});
  if (result.error) throw result.error;
  if (result.status !== 0) process.exit(result.status ?? 1);
  const offline = spawnSync(process.execPath, [fileURLToPath(new URL("./generate-offline.mjs", import.meta.url))], {stdio: "inherit"});
  if (offline.error) throw offline.error;
  process.exit(offline.status ?? 1);
}

// Import in this process so the preview owner retains its PID and signals.
const cli = new URL(managedLinux
  ? "../node_modules/vite/bin/vite.js"
  : "../node_modules/vinext/dist/cli.js", import.meta.url);
process.argv = [process.execPath, fileURLToPath(cli), command,
  ...(!managedLinux && command === "dev" ? ["--port", "5173"] : []), ...args];
await import(cli.href);
