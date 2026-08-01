import type { UpdateNotice } from "./types.js"

const formatNotice = (notice: UpdateNotice): string =>
  `Update available: ${notice.name} ${notice.current} -> ${notice.latest}. Run \`${notice.command}\` to upgrade.`

export { formatNotice }
