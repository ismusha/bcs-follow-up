import { describe, expect, it } from "vitest";
import { displayStatus, isJobPast, validateAssignment } from "@/lib/assignment";

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

describe("Assignment status follows the clock", () => {
  const job = { date: "2026-10-21", end_date: "", start_time: "08:00", end_time: "11:00", status: "scheduled" as const };

  it("shows Upcoming before the start time", () => {
    expect(displayStatus(job, new Date("2026-10-21T07:59:00"))).toBe("scheduled");
  });

  it("shows Pending while the job is being done", () => {
    expect(displayStatus(job, new Date("2026-10-21T09:00:00"))).toBe("in_progress");
  });

  it("shows Completed once the finish time passes", () => {
    expect(displayStatus(job, new Date("2026-10-21T11:00:00"))).toBe("completed");
  });

  it("keeps a multi-day job Pending until its final day's finish time", () => {
    const multi = { ...job, end_date: "2026-10-23" };
    expect(displayStatus(multi, new Date("2026-10-22T20:00:00"))).toBe("in_progress");
    expect(displayStatus(multi, new Date("2026-10-23T11:00:00"))).toBe("completed");
  });

  it("never changes a cancelled job", () => {
    expect(displayStatus({ ...job, status: "cancelled" }, new Date("2026-10-22T12:00:00"))).toBe("cancelled");
  });

  it("keeps a job staff marked Completed early", () => {
    expect(displayStatus({ ...job, status: "completed" }, new Date("2026-10-21T07:00:00"))).toBe("completed");
  });
});
