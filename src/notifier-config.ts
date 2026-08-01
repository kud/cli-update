import { mkdirSync, readFileSync, writeFileSync } from "node:fs"
import { homedir } from "node:os"
import { join } from "node:path"

type NotifierConfig = {
  updateNotifier?: boolean
  packages?: Record<string, boolean>
}

const configDir = (): string => join(homedir(), ".config", "kud")
const configPath = (): string => join(configDir(), "cli.json")

const readConfig = (): NotifierConfig => {
  try {
    const parsed = JSON.parse(readFileSync(configPath(), "utf8"))
    return typeof parsed === "object" && parsed !== null ? parsed : {}
  } catch {
    return {}
  }
}

const writeConfig = (config: NotifierConfig): void => {
  try {
    mkdirSync(configDir(), { recursive: true })
    writeFileSync(configPath(), JSON.stringify(config, null, 2))
  } catch {
    // best-effort: a read-only home directory must never break the CLI
  }
}

const noticesEnabled = (name: string): boolean => {
  const config = readConfig()
  const perPackage = config.packages?.[name]
  if (typeof perPackage === "boolean") return perPackage
  if (typeof config.updateNotifier === "boolean") return config.updateNotifier
  return true
}

const setNoticesEnabled = (enabled: boolean, scope?: string): void => {
  const config = readConfig()
  if (!scope) {
    writeConfig({ ...config, updateNotifier: enabled })
    return
  }
  writeConfig({ ...config, packages: { ...config.packages, [scope]: enabled } })
}

const disableNotices = (scope?: string): void => setNoticesEnabled(false, scope)
const enableNotices = (scope?: string): void => setNoticesEnabled(true, scope)

export {
  noticesEnabled,
  disableNotices,
  enableNotices,
  readConfig,
  writeConfig,
  configPath,
}
export type { NotifierConfig }
