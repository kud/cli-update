// Runs as its own process, spawned by notify(). This is the whole point of the
// separation: Ink and React are loaded *here*, never in the CLI that called us.
// A plain commander CLI with no interest in Ink still gets the rendered banner,
// because the rendering happens somewhere else entirely.
import React, { useState } from "react"
import { render, Box, Text, useApp, useInput } from "ink"
import { UpdateBanner, Spinner } from "@kud/ink-ui"
import { upgrade, banner } from "./upgrade.js"
import type { UpdateNotice } from "./types.js"

const [name, current, latest, command] = process.argv.slice(2)

if (!name || !current || !latest || !command) process.exit(1)

const notice: UpdateNotice = { name, current, latest, command }

// stdout being a TTY does not mean stdin is: `echo x | duux` has one without
// the other, and Ink's useInput needs raw mode on stdin or it throws. There is
// nobody to answer a prompt in that case, so show the plain banner and leave.
if (!process.stdin.isTTY) {
  process.stderr.write(`\n${banner(notice)}\n\n`)
  process.exit(0)
}

// Kept short so a long npm line cannot wrap and break the layout mid-render.
const truncate = (line: string, width = 60): string =>
  line.length > width ? `${line.slice(0, width - 1)}…` : line

const Prompt = () => {
  const { exit } = useApp()
  const [state, setState] = useState<
    "asking" | "upgrading" | "done" | "failed"
  >("asking")
  const [status, setStatus] = useState("")

  useInput((input, key) => {
    if (key.ctrl && input === "c") exit()
  })

  const confirm = () => {
    setState("upgrading")
    // Capturing npm's output rather than inheriting it: inherited writes land
    // on top of whatever Ink is drawing, which is what made the raw install
    // log collide with the banner. Captured, it becomes a status line Ink owns.
    void upgrade(notice, {
      onOutput: (line) => setStatus(truncate(line)),
    }).then((ok) => {
      setState(ok ? "done" : "failed")
      setTimeout(exit, 500)
    })
  }

  if (state === "asking") {
    return (
      <UpdateBanner
        name={notice.name}
        current={notice.current}
        latest={notice.latest}
        command={notice.command}
        onConfirm={confirm}
        onDecline={exit}
      />
    )
  }

  if (state === "upgrading") {
    return (
      <Box flexDirection="column" paddingX={2} paddingY={1} rowGap={1}>
        <Box columnGap={1}>
          <Spinner />
          <Text>Upgrading {notice.name}…</Text>
        </Box>
        {status !== "" && <Text dimColor>{status}</Text>}
      </Box>
    )
  }

  return (
    <Box paddingX={2} paddingY={1}>
      {state === "done" ? (
        <Text color="green">
          ✔ Upgraded {notice.name} to {notice.latest}
        </Text>
      ) : (
        <Text color="red">
          ✖ Upgrade failed — run {notice.command} yourself
        </Text>
      )}
    </Box>
  )
}

// stderr, so a banner can never end up inside a CLI's piped stdout even if the
// TTY check upstream were somehow bypassed.
render(<Prompt />, { stdout: process.stderr })
