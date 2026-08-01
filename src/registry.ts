type NpmRegistryResponse = {
  version?: string
}

const REGISTRY_TIMEOUT_MS = 5000

const fetchLatestVersion = async (name: string): Promise<string | null> => {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), REGISTRY_TIMEOUT_MS)

  try {
    const response = await fetch(
      `https://registry.npmjs.org/${encodeURIComponent(name)}/latest`,
      { signal: controller.signal },
    )
    if (!response.ok) return null

    const data = (await response.json()) as NpmRegistryResponse
    return typeof data.version === "string" ? data.version : null
  } catch {
    return null
  } finally {
    clearTimeout(timeout)
  }
}

export { fetchLatestVersion }
