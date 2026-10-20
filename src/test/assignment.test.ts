import { describe, expect, it } from "vitest";
import { validateAssignment } from "@/lib/assignment";

const base = {
  date: "2026-10-16",
  end_date: "",
  start_time: "08:00",
  end_time: "11:00",
  location: "ECA",
  cleaner_ids: ["wabi"],
  remark: "",
};

describe("Internal cleaning assignment", () => {
  it("accepts the ECA assignment with multiple cleaners and start and finish times", () => {
    expect(validateAssignment({
      ...base,
      cleaner_ids: ["wabi", "zelalem"],
      remark: "Office cleaning and floor cleaning.",
    })).toEqual([]);
  });

  it("accepts a multi-day assignment when the finish date is after the start date", () => {
    expect(validateAssignment({ ...base, end_date: "2026-10-18" })).toEqual([]);
  });

  it("rejects a finish date before the start date", () => {
    expect(validateAssignment({ ...base, end_date: "2026-10-15" }))
      .toContain("Finish date must be on or after the start date.");
  });

  it("requires at least one assigned cleaner", () => {
    expect(validateAssignment({ ...base, cleaner_ids: [] }))
      .toContain("Assign at least one cleaner.");
  });

  it("requires both start and finish times", () => {
    for (const times of [{ start_time: "", end_time: "11:00" }, { start_time: "08:00", end_time: "" }]) {
      expect(validateAssignment({ ...base, ...times }))
        .toContain("Set start and finish time.");
    }
  });

  it("rejects finish times at or before the start time", () => {
    for (const end_time of ["08:00", "07:00"]) {
      expect(validateAssignment({ ...base, end_time }))
        .toContain("Finish time must be after start time.");
    }
  });
});
