import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

const state = vi.hoisted(() => ({ homeDir: "" }))

vi.mock("node:os", async (importOriginal) => {
  const actual = await importOriginal<typeof import("node:os")>()
  return { ...actual, homedir: () => state.homeDir }
})

import {
  disableNotices,
  enableNotices,
  noticesEnabled,
} from "./notifier-config.js"

const configFile = (): string =>
  join(state.homeDir, ".config", "kud", "cli.json")

beforeEach(() => {
  state.homeDir = mkdtempSync(join(tmpdir(), "cli-update-test-"))
})

afterEach(() => {
  rmSync(state.homeDir, { recursive: true, force: true })
})

describe("noticesEnabled", () => {
  it("is enabled when no config file exists", () => {
    expect(noticesEnabled("@kud/duux-cli")).toBe(true)
  })

  it("respects a global opt-out", () => {
    disableNotices()

    expect(noticesEnabled("@kud/duux-cli")).toBe(false)
    expect(noticesEnabled("@kud/other-cli")).toBe(false)
  })

  it("lets a per-package enable win over a global disable", () => {
    disableNotices()
    enableNotices("@kud/duux-cli")

    expect(noticesEnabled("@kud/duux-cli")).toBe(true)
    expect(noticesEnabled("@kud/other-cli")).toBe(false)
  })

  it("lets a per-package disable win over a global enable", () => {
    enableNotices()
    disableNotices("@kud/duux-cli")

    expect(noticesEnabled("@kud/duux-cli")).toBe(false)
    expect(noticesEnabled("@kud/other-cli")).toBe(true)
  })

  it("degrades to enabled when the config file is corrupt", () => {
    mkdirSync(join(state.homeDir, ".config", "kud"), { recursive: true })
    writeFileSync(configFile(), "not json", "utf8")

    expect(noticesEnabled("@kud/duux-cli")).toBe(true)
  })
})
