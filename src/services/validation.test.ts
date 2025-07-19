import { describe, it, expect, beforeEach } from "vitest";
import { SDDirectValidator, sdDirectValidator } from "./validation.js";

describe("SDDirectValidator", () => {
  let validator: SDDirectValidator;

  beforeEach(() => {
    validator = new SDDirectValidator();
  });

  it("should support SDDirect format", () => {
    expect(validator.supportsFormat("SDDirect")).toBe(true);
    expect(validator.supportsFormat("sddirect")).toBe(true);
    expect(validator.supportsFormat("SDDIRECT")).toBe(true);
  });

  it("should not support other formats", () => {
    expect(validator.supportsFormat("BACS")).toBe(false);
    expect(validator.supportsFormat("FasterPayments")).toBe(false);
  });

  it("should return correct format name", () => {
    expect(validator.getSupportedFormat()).toBe("SDDirect");
  });

  it("should export a singleton instance", () => {
    expect(sdDirectValidator).toBeInstanceOf(SDDirectValidator);
    expect(sdDirectValidator.getSupportedFormat()).toBe("SDDirect");
  });
});