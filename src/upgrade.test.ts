import { describe, it, expect } from "vitest"
import { banner } from "./upgrade.js"
import type { UpdateNotice } from "./types.js"

const NOTICE: UpdateNotice = {
  name: "@kud/duux-cli",
  current: "0.7.0",
  latest: "0.8.0",
  command: "npm i -g @kud/duux-cli",
}

// eslint-disable-next-line no-control-regex
const stripAnsi = (s: string): string => s.replace(/\[[0-9;]*m/g, "")

describe("banner", () => {
  it("draws a box whose every line is the same width", () => {
    const lines = stripAnsi(banner(NOTICE)).split("\n")
    const widths = new Set(lines.map((l) => [...l].length))
    expect(widths.size).toBe(1)
  })

  // The width has to be measured on the plain text: counting the escape bytes
  // as characters is what makes a coloured box come out ragged.
  it("is not thrown off by the colour codes inside it", () => {
    const raw = banner(NOTICE)
    expect(raw).not.toBe(stripAnsi(raw))
    const lines = stripAnsi(raw).split("\n")
    expect(new Set(lines.map((l) => l.length)).size).toBe(1)
  })

  it("shows both versions and the command to run", () => {
    const plain = stripAnsi(banner(NOTICE))
    expect(plain).toContain("0.7.0")
    expect(plain).toContain("0.8.0")
    expect(plain).toContain("npm i -g @kud/duux-cli")
    expect(plain).toContain("@kud/duux-cli")
  })

  it("widens to fit a long package name rather than clipping it", () => {
    const long = { ...NOTICE, name: "@kud/a-very-long-package-name-indeed" }
    const plain = stripAnsi(banner(long))
    expect(plain).toContain(long.name)
    expect(new Set(plain.split("\n").map((l) => l.length)).size).toBe(1)
  })
})
