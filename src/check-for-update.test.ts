import { mkdtempSync, rmSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

const state = vi.hoisted(() => ({ homeDir: "" }))

vi.mock("node:os", async (importOriginal) => {
  const actual = await importOriginal<typeof import("node:os")>()
  return { ...actual, homedir: () => state.homeDir }
})

const spawnRefresh = vi.hoisted(() => vi.fn())
vi.mock("./spawn-refresh.js", () => ({ spawnRefresh }))

import { checkForUpdate } from "./check-for-update.js"
import { disableNotices } from "./notifier-config.js"
import { writeCacheEntry } from "./update-cache.js"

const originalIsTTY = process.stdout.isTTY

const setTTY = (value: boolean): void => {
  Object.defineProperty(process.stdout, "isTTY", { value, configurable: true })
}

beforeEach(() => {
  state.homeDir = mkdtempSync(join(tmpdir(), "cli-update-test-"))
  setTTY(true)
  delete process.env.CI
  delete process.env.NO_UPDATE_NOTIFIER
  spawnRefresh.mockClear()
})

afterEach(() => {
  rmSync(state.homeDir, { recursive: true, force: true })
  setTTY(originalIsTTY as boolean)
})

describe("checkForUpdate", () => {
  it("returns null when stdout is not a TTY", async () => {
    setTTY(false)
    writeCacheEntry("@kud/duux-cli", { latest: "2.0.0", checkedAt: Date.now() })

    const notice = await checkForUpdate({
      name: "@kud/duux-cli",
      version: "1.0.0",
    })

    expect(notice).toBeNull()
    expect(spawnRefresh).not.toHaveBeenCalled()
  })

  it("returns null when CI is set", async () => {
    process.env.CI = "true"
    writeCacheEntry("@kud/duux-cli", { latest: "2.0.0", checkedAt: Date.now() })

    expect(
      await checkForUpdate({ name: "@kud/duux-cli", version: "1.0.0" }),
    ).toBeNull()
  })

  it("returns null when NO_UPDATE_NOTIFIER is set", async () => {
    process.env.NO_UPDATE_NOTIFIER = "1"
    writeCacheEntry("@kud/duux-cli", { latest: "2.0.0", checkedAt: Date.now() })

    expect(
      await checkForUpdate({ name: "@kud/duux-cli", version: "1.0.0" }),
    ).toBeNull()
  })

  it("returns null and skips the refresh when notices are disabled for the package", async () => {
    disableNotices("@kud/duux-cli")
    writeCacheEntry("@kud/duux-cli", { latest: "2.0.0", checkedAt: Date.now() })

    const notice = await checkForUpdate({
      name: "@kud/duux-cli",
      version: "1.0.0",
    })

    expect(notice).toBeNull()
    expect(spawnRefresh).not.toHaveBeenCalled()
  })

  it("returns a notice from a fresh cache without spawning a refresh", async () => {
    writeCacheEntry("@kud/duux-cli", { latest: "2.0.0", checkedAt: Date.now() })

    const notice = await checkForUpdate({
      name: "@kud/duux-cli",
      version: "1.0.0",
    })

    expect(notice).toEqual({
      name: "@kud/duux-cli",
      current: "1.0.0",
      latest: "2.0.0",
      command: "npm i -g @kud/duux-cli",
    })
    expect(spawnRefresh).not.toHaveBeenCalled()
  })

  it("returns null when the cached version is not newer", async () => {
    writeCacheEntry("@kud/duux-cli", { latest: "1.0.0", checkedAt: Date.now() })

    expect(
      await checkForUpdate({ name: "@kud/duux-cli", version: "1.0.0" }),
    ).toBeNull()
  })

  it("treats a prerelease correctly against a stable current version", async () => {
    writeCacheEntry("@kud/duux-cli", {
      latest: "1.1.0-beta.1",
      checkedAt: Date.now(),
    })

    const notice = await checkForUpdate({
      name: "@kud/duux-cli",
      version: "1.0.0",
    })

    expect(notice?.latest).toBe("1.1.0-beta.1")
  })

  it("spawns a background refresh and returns null when there is no cache yet", async () => {
    const notice = await checkForUpdate({
      name: "@kud/duux-cli",
      version: "1.0.0",
    })

    expect(notice).toBeNull()
    expect(spawnRefresh).toHaveBeenCalledWith("@kud/duux-cli")
  })

  it("spawns a background refresh for a stale cache while still returning the stale notice", async () => {
    const staleCheckedAt = Date.now() - 25 * 60 * 60 * 1000
    writeCacheEntry("@kud/duux-cli", {
      latest: "2.0.0",
      checkedAt: staleCheckedAt,
    })

    const notice = await checkForUpdate({
      name: "@kud/duux-cli",
      version: "1.0.0",
      cacheHours: 24,
    })

    expect(notice?.latest).toBe("2.0.0")
    expect(spawnRefresh).toHaveBeenCalledWith("@kud/duux-cli")
  })

  it("does not spawn a refresh while the cache is still fresh", async () => {
    writeCacheEntry("@kud/duux-cli", { latest: "2.0.0", checkedAt: Date.now() })

    await checkForUpdate({
      name: "@kud/duux-cli",
      version: "1.0.0",
      cacheHours: 24,
    })

    expect(spawnRefresh).not.toHaveBeenCalled()
  })

  it("never throws, even when called with malformed options", async () => {
    // @ts-expect-error deliberately malformed input, to prove the function cannot throw
    const notice = await checkForUpdate(undefined)

    expect(notice).toBeNull()
  })
})
