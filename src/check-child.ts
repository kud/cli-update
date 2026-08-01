import { fetchLatestVersion } from "./registry.js"
import { writeCacheEntry } from "./update-cache.js"

// Standalone entry point spawned detached by spawn-refresh.ts. It is not part
// of the package's public exports — it exists purely so the network fetch
// happens in a process the parent CLI never has to wait on.
const run = async (): Promise<void> => {
  const [, , name] = process.argv
  if (!name) return

  const latest = await fetchLatestVersion(name)
  if (!latest) return

  writeCacheEntry(name, { latest, checkedAt: Date.now() })
}

void run()
