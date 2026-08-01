import { spawn } from "node:child_process"
import { fileURLToPath } from "node:url"
import { checkForUpdate } from "./check-for-update.js"
import type { CheckForUpdateOptions } from "./types.js"

// The one call a CLI makes. Checks, and if there is an update, shows the shared
// banner and offers the upgrade — the same banner in every @kud CLI, whether or
// not that CLI uses Ink.
//
// The banner renders in a child process rather than here. That is what lets a
// plain commander CLI get an Ink-rendered banner: Ink and React load in the
// child, never in the caller.
const notify = async (options: CheckForUpdateOptions): Promise<void> => {
  const notice = await checkForUpdate(options)
  if (!notice) return

  await new Promise<void>((resolve) => {
    try {
      const child = spawn(
        process.execPath,
        [
          fileURLToPath(new URL("./banner-child.js", import.meta.url)),
          notice.name,
          notice.current,
          notice.latest,
          notice.command,
        ],
        // Inherited so the child owns the terminal for its prompt, and so npm's
        // own output is visible if the user accepts.
        { stdio: "inherit" },
      )
      child.on("error", () => resolve())
      child.on("close", () => resolve())
    } catch {
      // Showing an upgrade offer must never be able to break the CLI it
      // interrupted. A failure here is silence, nothing more.
      resolve()
    }
  })
}

export { notify }
