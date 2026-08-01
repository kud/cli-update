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
  cachePath,
  isStale,
  readCacheEntry,
  writeCacheEntry,
} from "./update-cache.js"

beforeEach(() => {
  state.homeDir = mkdtempSync(join(tmpdir(), "cli-update-test-"))
})

afterEach(() => {
  rmSync(state.homeDir, { recursive: true, force: true })
})

describe("readCacheEntry", () => {
  it("returns null when there is no cache file", () => {
    expect(readCacheEntry("@kud/duux-cli")).toBeNull()
  })

  it("round-trips a written entry", () => {
    writeCacheEntry("@kud/duux-cli", { latest: "2.0.0", checkedAt: 123 })

    expect(readCacheEntry("@kud/duux-cli")).toEqual({
      latest: "2.0.0",
      checkedAt: 123,
    })
  })

  it("degrades to null when the cache file is corrupt", () => {
    mkdirSync(join(state.homeDir, ".config", "kud"), { recursive: true })
    writeFileSync(cachePath(), "{not valid json", "utf8")

    expect(readCacheEntry("@kud/duux-cli")).toBeNull()
  })

  it("degrades to null when an entry is malformed", () => {
    mkdirSync(join(state.homeDir, ".config", "kud"), { recursive: true })
    writeFileSync(
      cachePath(),
      JSON.stringify({ "@kud/duux-cli": { latest: 2 } }),
      "utf8",
    )

    expect(readCacheEntry("@kud/duux-cli")).toBeNull()
  })
})

describe("isStale", () => {
  it("is false right after checking", () => {
    expect(isStale({ latest: "2.0.0", checkedAt: Date.now() }, 24)).toBe(false)
  })

  it("is true once the cache window has elapsed", () => {
    const checkedAt = Date.now() - 25 * 60 * 60 * 1000

    expect(isStale({ latest: "2.0.0", checkedAt }, 24)).toBe(true)
  })
})
