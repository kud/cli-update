import { checkForUpdate } from "./check-for-update.js"
import { formatNotice } from "./format-notice.js"
import {
  disableNotices,
  enableNotices,
  noticesEnabled,
} from "./notifier-config.js"
import type { CheckForUpdateOptions, UpdateNotice } from "./types.js"

export {
  checkForUpdate,
  formatNotice,
  disableNotices,
  enableNotices,
  noticesEnabled,
}
export { notify } from "./notify.js"
export { promptUpgrade, upgrade, banner } from "./upgrade.js"
export type { UpgradeOutcome } from "./upgrade.js"
export type { UpdateNotice, CheckForUpdateOptions }
