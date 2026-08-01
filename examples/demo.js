// Run with `npm run demo`. Plain .js against the built output rather than
// TypeScript, so it exercises exactly what a consumer imports — a demo that
// runs through the source would prove less than one that runs through dist/.
import {
  checkForUpdate,
  formatNotice,
  noticesEnabled,
  disableNotices,
  enableNotices,
} from "../dist/index.js"

const PKG = "@kud/duux-cli"
const PRETEND_INSTALLED = "0.1.0"

const line = (label, value) => console.log(`  ${label.padEnd(24)}${value}`)

console.log("\n@kud/cli-update\n")

line(
  "stdout is a TTY?",
  process.stdout.isTTY ? "yes" : "no  ← everything below stays silent",
)
line("notices enabled?", noticesEnabled(PKG) ? "yes" : "no")

console.log("\n1. checking is instant — the network is never awaited")
const started = Date.now()
const notice = await checkForUpdate({ name: PKG, version: PRETEND_INSTALLED })
line("elapsed", `${Date.now() - started}ms`)
line("notice", notice ? formatNotice(notice) : "none")
if (!notice && process.stdout.isTTY) {
  line("", "(cold cache — a background refresh just ran, try again)")
}

console.log("\n2. opting out, per package")
disableNotices(PKG)
line("disabled", noticesEnabled(PKG) ? "still enabled?!" : "yes")
line(
  "check now returns",
  String(await checkForUpdate({ name: PKG, version: PRETEND_INSTALLED })),
)
enableNotices(PKG)
line("re-enabled", noticesEnabled(PKG) ? "yes" : "no")

console.log("\n3. the other ways to silence it")
console.log("   NO_UPDATE_NOTIFIER=1 npm run demo   → silent")
console.log("   npm run demo | cat                  → silent, not a TTY")
console.log("   CI=1 npm run demo                   → silent")

console.log("\n   config  ~/.config/kud/cli.json")
console.log("   cache   ~/.config/kud/update-cache.json\n")
