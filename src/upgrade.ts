import { spawn } from "node:child_process"
import { createInterface } from "node:readline/promises"
import type { UpdateNotice } from "./types.js"

type UpgradeOutcome = "upgraded" | "declined" | "failed"

// ANSI written by hand rather than pulling in a colour library: this package is
// imported by every @kud CLI, so its dependency list is a tax on all of them.
const dim = (s: string) => `[2m${s}[22m`
const bold = (s: string) => `[1m${s}[22m`
const cyan = (s: string) => `[36m${s}[39m`
const green = (s: string) => `[32m${s}[39m`

// Width is measured on the plain text, never the escaped string — counting
// ANSI bytes as characters is the classic way box borders end up ragged.
const box = (lines: Array<{ plain: string; styled: string }>): string => {
  const width = Math.max(...lines.map((l) => l.plain.length))
  const top = `╭${"─".repeat(width + 2)}╮`
  const bottom = `╰${"─".repeat(width + 2)}╯`
  const body = lines.map(
    (l) => `│ ${l.styled}${" ".repeat(width - l.plain.length)} │`,
  )
  return [top, ...body, bottom].map(dim).join("\n")
}

const banner = (notice: UpdateNotice): string => {
  // The package name leads, matching @kud/ink-ui's UpdateBanner: when several
  // CLIs might be offering an upgrade, which one is asking is what you need
  // first. "update available" is identical on every banner, so it says nothing.
  const headline = `${notice.name} · update available`
  const versions = `${notice.current} → ${notice.latest}`
  return box([
    {
      plain: headline,
      styled: `${bold(notice.name)} ${dim("· update available")}`,
    },
    {
      plain: versions,
      styled: `${dim(notice.current)} → ${green(notice.latest)}`,
    },
    { plain: notice.command, styled: cyan(notice.command) },
  ])
}

type UpgradeOptions = {
  // Called with each line npm emits. Supplying it switches from inheriting
  // npm's streams to capturing them — which is what an Ink caller needs, since
  // inherited output writes over whatever Ink is drawing. Without it, npm's
  // output goes straight to the terminal as usual.
  onOutput?: (line: string) => void
}

const upgrade = (
  notice: UpdateNotice,
  options: UpgradeOptions = {},
): Promise<boolean> =>
  new Promise((resolve) => {
    const [command, ...args] = notice.command.split(" ")
    if (!command) return resolve(false)

    const capture = Boolean(options.onOutput)
    try {
      const child = spawn(command, args, {
        stdio: capture ? ["ignore", "pipe", "pipe"] : "inherit",
      })

      if (capture) {
        const emit = (chunk: Buffer) => {
          for (const line of chunk.toString().split("\n")) {
            const trimmed = line.trim()
            if (trimmed) options.onOutput?.(trimmed)
          }
        }
        child.stdout?.on("data", emit)
        // npm writes progress and warnings to stderr; a caller showing status
        // wants those too, not only the final summary on stdout.
        child.stderr?.on("data", emit)
      }

      child.on("error", () => resolve(false))
      child.on("close", (code) => resolve(code === 0))
    } catch {
      resolve(false)
    }
  })

// Shows the banner, asks, and upgrades on yes. Returns rather than exiting, so
// the calling CLI decides what happens next — it may have work still to do.
const promptUpgrade = async (notice: UpdateNotice): Promise<UpgradeOutcome> => {
  process.stderr.write(`\n${banner(notice)}\n`)

  const rl = createInterface({ input: process.stdin, output: process.stderr })
  try {
    const answer = await rl.question(dim("  Upgrade now? ") + "(Y/n) ")
    if (/^n/i.test(answer.trim())) return "declined"
  } catch {
    // Ctrl-C or a closed stdin is a decline, not a failure.
    return "declined"
  } finally {
    rl.close()
  }

  const ok = await upgrade(notice)
  process.stderr.write(
    ok
      ? green(`\n✔ Upgraded to ${notice.latest}\n\n`)
      : `\n✖ Upgrade failed. Run \`${notice.command}\` yourself.\n\n`,
  )
  return ok ? "upgraded" : "failed"
}

export { promptUpgrade, upgrade, banner }
export type { UpgradeOutcome }
