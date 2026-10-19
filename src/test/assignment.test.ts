import { describe, expect, it } from "vitest";
import { validateAssignment } from "@/lib/assignment";

describe("Internal cleaning assignment", () => {
  it("accepts the ECA assignment with multiple cleaners and start and finish times", () => {
    expect(validateAssignment({
      date: "2026-10-16",
      start_time: "08:00",
      end_time: "11:00",
      location: "ECA",
      cleaner_ids: ["wabi", "zelalem"],
      remark: "Office cleaning and floor cleaning.",
    })).toEqual([]);
  });

  it("requires at least one assigned cleaner", () => {
    expect(validateAssignment({ date: "2026-10-16", start_time: "08:00", end_time: "11:00", location: "ECA", cleaner_ids: [], remark: "" }))
      .toContain("Assign at least one cleaner.");
  });

  it("requires both start and finish times", () => {
    for (const times of [{ start_time: "", end_time: "11:00" }, { start_time: "08:00", end_time: "" }]) {
      expect(validateAssignment({ date: "2026-10-16", location: "ECA", cleaner_ids: ["wabi"], remark: "", ...times }))
        .toContain("Set start and finish time.");
    }
  });

  it("rejects finish times at or before the start time", () => {
    for (const end_time of ["08:00", "07:00"]) {
      expect(validateAssignment({ date: "2026-10-16", start_time: "08:00", end_time, location: "ECA", cleaner_ids: ["wabi"], remark: "" }))
        .toContain("Finish time must be after start time.");
    }
  });
});