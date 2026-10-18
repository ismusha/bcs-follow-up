import { describe, expect, it } from "vitest";
import { validateAssignment } from "@/lib/assignment";

describe("Internal cleaning assignment", () => {
  it("accepts the ECA assignment with multiple cleaners and no booking fields", () => {
    expect(validateAssignment({
      date: "2026-10-16",
      location: "ECA",
      cleaner_ids: ["wabi", "zelalem"],
      remark: "Office cleaning and floor cleaning.",
    })).toEqual([]);
  });

  it("requires at least one assigned cleaner", () => {
    expect(validateAssignment({ date: "2026-10-16", location: "ECA", cleaner_ids: [], remark: "" }))
      .toContain("Assign at least one cleaner.");
  });
});