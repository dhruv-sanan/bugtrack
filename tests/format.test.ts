import { describe, expect, it } from "vitest";
import { safeNextPath } from "@/lib/format";

describe("safeNextPath", () => {
  it("keeps same-origin paths", () => {
    expect(safeNextPath("/tickets/12?x=1")).toBe("/tickets/12?x=1");
  });

  it("falls back for anything that could leave the site", () => {
    for (const next of [null, "", "https://evil.test", "//evil.test", "/\\evil.test"]) {
      expect(safeNextPath(next)).toBe("/tickets");
    }
  });
});
