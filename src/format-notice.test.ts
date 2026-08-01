import { describe, expect, it } from "vitest"
import { formatNotice } from "./format-notice.js"

describe("formatNotice", () => {
  it("formats a one-line, colour-free upgrade message", () => {
    const message = formatNotice({
      name: "@kud/duux-cli",
      current: "1.0.0",
      latest: "2.0.0",
      command: "npm i -g @kud/duux-cli",
    })

    expect(message).toBe(
      "Update available: @kud/duux-cli 1.0.0 -> 2.0.0. Run `npm i -g @kud/duux-cli` to upgrade.",
    )
  })
})
