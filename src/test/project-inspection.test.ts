import { describe, expect, it } from "vitest";
import { inspectionSchema } from "@/lib/project-inspection";

const input = { project_name: "ECA", inspection_date: "2026-10-23", inspected_by: "Bethelehem", remark: "Floor inspected." };
describe("Project inspection rules", () => {
  it("accepts Bethelehem", () => expect(inspectionSchema.safeParse(input).success).toBe(true));
  it("accepts Eshetu", () => expect(inspectionSchema.safeParse({ ...input, inspected_by: "Eshetu" }).success).toBe(true));
  it("rejects any other inspector", () => expect(inspectionSchema.safeParse({ ...input, inspected_by: "Wabi" }).success).toBe(false));
  it("requires a project name", () => expect(inspectionSchema.safeParse({ ...input, project_name: " " }).success).toBe(false));
  it("requires a chosen valid date", () => expect(inspectionSchema.safeParse({ ...input, inspection_date: "2026-02-30" }).success).toBe(false));
});