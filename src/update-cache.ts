import { mkdirSync, readFileSync, writeFileSync } from "node:fs"
import { homedir } from "node:os"
import { join } from "node:path"

type CacheEntry = {
  latest: string
  checkedAt: number
}

type Cache = Record<string, CacheEntry>

const cacheDir = (): string => join(homedir(), ".config", "kud")
const cachePath = (): string => join(cacheDir(), "update-cache.json")

const readCache = (): Cache => {
  try {
    const parsed = JSON.parse(readFileSync(cachePath(), "utf8"))
    return typeof parsed === "object" && parsed !== null ? parsed : {}
  } catch {
    return {}
  }
}

const isValidEntry = (entry: unknown): entry is CacheEntry =>
  typeof entry === "object" &&
  entry !== null &&
  typeof (entry as CacheEntry).latest === "string" &&
  typeof (entry as CacheEntry).checkedAt === "number"

const readCacheEntry = (name: string): CacheEntry | null => {
  const entry = readCache()[name]
  return isValidEntry(entry) ? entry : null
}

const writeCacheEntry = (name: string, entry: CacheEntry): void => {
  try {
    const cache = readCache()
    cache[name] = entry
    mkdirSync(cacheDir(), { recursive: true })
    writeFileSync(cachePath(), JSON.stringify(cache, null, 2))
  } catch {
    // best-effort: a failed cache write must never break the CLI
  }
}

const isStale = (entry: CacheEntry, cacheHours: number): boolean =>
  Date.now() - entry.checkedAt > cacheHours * 60 * 60 * 1000

export { readCacheEntry, writeCacheEntry, isStale, cachePath }
export type { CacheEntry, Cache }
