type UpdateNotice = {
  name: string
  current: string
  latest: string
  command: string
}

type CheckForUpdateOptions = {
  name: string
  version: string
  cacheHours?: number
}

export type { UpdateNotice, CheckForUpdateOptions }
