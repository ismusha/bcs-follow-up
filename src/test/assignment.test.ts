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

describe("Automatic completion when the settled time has passed", () => {
  const now = new Date("2026-10-21T12:00:00");

  it("shows a scheduled job as completed once its finish date and time have passed", () => {
    expect(displayStatus({ date: "2026-10-21", end_date: "", start_time: "08:00", end_time: "11:00", status: "scheduled" }, now))
      .toBe("completed");
  });

  it("shows a multi-day job as completed only after the finish day's end time", () => {
    const job = { date: "2026-10-20", end_date: "2026-10-21", start_time: "08:00", end_time: "13:00", status: "scheduled" as const };
    expect(displayStatus(job, now)).toBe("scheduled");
    expect(displayStatus(job, new Date("2026-10-21T13:00:00"))).toBe("completed");
  });

  it("keeps a future job scheduled", () => {
    expect(displayStatus({ date: "2026-10-22", end_date: "", start_time: "08:00", end_time: "11:00", status: "scheduled" }, now))
      .toBe("scheduled");
  });

  it("never auto-completes a cancelled job", () => {
    expect(displayStatus({ date: "2026-10-20", end_date: "", start_time: "08:00", end_time: "11:00", status: "cancelled" }, now))
      .toBe("cancelled");
  });

  it("keeps an in-progress job running until its finish time passes", () => {
    const job = { date: "2026-10-21", end_date: "", start_time: "08:00", end_time: "14:00", status: "in_progress" as const };
    expect(displayStatus(job, now)).toBe("in_progress");
    expect(displayStatus(job, new Date("2026-10-21T14:30:00"))).toBe("completed");
  });

  it("treats a job ending exactly now as past", () => {
    expect(isJobPast({ date: "2026-10-21", end_date: "", end_time: "12:00" }, now)).toBe(true);
  });
});
