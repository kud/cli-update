import semver from "semver"
import { readCacheEntry, isStale } from "./update-cache.js"
import { noticesEnabled } from "./notifier-config.js"
import { spawnRefresh } from "./spawn-refresh.js"
import type { CheckForUpdateOptions, UpdateNotice } from "./types.js"

const DEFAULT_CACHE_HOURS = 24

// stdout being a non-TTY covers piping, redirects, --json output, cron, and CI
// in one check, without this package needing to understand any CLI's flags —
// this is the property that makes it safe for `duux status --json | jq`.
const outputIsSuppressed = (): boolean =>
  !process.stdout.isTTY ||
  Boolean(process.env.CI) ||
  Boolean(process.env.NO_UPDATE_NOTIFIER)

const buildNotice = (
  name: string,
  current: string,
  latest: string,
): UpdateNotice => ({
  name,
  current,
  latest,
  command: `npm i -g ${name}`,
})

// Reads the cache and returns immediately — the network is never awaited.
// A stale or missing cache entry triggers a detached, unref'd refresh whose
// result only shows up on the NEXT run, so a hanging registry can never
// delay startup of the CLI that called this.
const checkForUpdate = async (
  options: CheckForUpdateOptions,
): Promise<UpdateNotice | null> => {
  try {
    const { name, version, cacheHours = DEFAULT_CACHE_HOURS } = options

    if (outputIsSuppressed()) return null
    if (!noticesEnabled(name)) return null

    const entry = readCacheEntry(name)
    if (!entry || isStale(entry, cacheHours)) {
      spawnRefresh(name)
    }

    if (!entry) return null
    if (!semver.valid(entry.latest) || !semver.valid(version)) return null
    if (!semver.gt(entry.latest, version)) return null

    return buildNotice(name, version, entry.latest)
  } catch {
    return null
  }
}

export { checkForUpdate }
