import { spawn } from "node:child_process"
import { fileURLToPath } from "node:url"

const childScriptPath = (): string =>
  fileURLToPath(new URL("./check-child.js", import.meta.url))

// Detached and unref'd so the refresh outlives the parent CLI's exit without
// ever holding the event loop open — this is what makes checkForUpdate
// instant instead of waiting on the registry.
const spawnRefresh = (name: string): void => {
  try {
    const child = spawn(process.execPath, [childScriptPath(), name], {
      detached: true,
      stdio: "ignore",
    })
    child.unref()
  } catch {
    // a failed spawn (sandboxed environment, missing execPath) must never block the CLI
  }
}

export { spawnRefresh }
