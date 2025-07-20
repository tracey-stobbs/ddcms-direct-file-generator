import { describe, it, expect } from "vitest";
import { validateRequest } from "./requestValidator.js";

describe("validateRequest", () => {
  it("should return errors for missing required fields", () => {
    const errors = validateRequest({} as any);
    expect(errors).toContain("fileType is required");
    expect(errors).toContain("canInlineEdit must be boolean");
  });

  it("should return no errors for valid request", () => {
    const errors = validateRequest({ fileType: "SDDirect", canInlineEdit: true } as any);
    expect(errors.length).toBe(0);
  });
});
