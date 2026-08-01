import { afterEach, describe, expect, it, vi } from "vitest"
import { fetchLatestVersion } from "./registry.js"

const originalFetch = global.fetch

afterEach(() => {
  global.fetch = originalFetch
  vi.restoreAllMocks()
})

describe("fetchLatestVersion", () => {
  it("returns the version from a successful response", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ version: "3.1.4" }),
    }) as unknown as typeof fetch

    expect(await fetchLatestVersion("@kud/duux-cli")).toBe("3.1.4")
  })

  it("returns null on a non-ok response", async () => {
    global.fetch = vi
      .fn()
      .mockResolvedValue({ ok: false }) as unknown as typeof fetch

    expect(await fetchLatestVersion("@kud/duux-cli")).toBeNull()
  })

  it("returns null instead of throwing when the network fails", async () => {
    global.fetch = vi
      .fn()
      .mockRejectedValue(
        new Error("getaddrinfo ENOTFOUND registry.npmjs.org"),
      ) as unknown as typeof fetch

    await expect(fetchLatestVersion("@kud/duux-cli")).resolves.toBeNull()
  })

  it("returns null when the response body has no version field", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({}),
    }) as unknown as typeof fetch

    expect(await fetchLatestVersion("@kud/duux-cli")).toBeNull()
  })
})
