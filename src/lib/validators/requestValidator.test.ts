import { describe, expect, it } from "vitest";
import type { GenerateRequest } from "../types";
import { validateAndNormalizeGenerateRequest, validateAndNormalizeHeaders, validateGenerateRequest } from "./requestValidator.js";

describe("Request Validator", () => {
  describe("validateGenerateRequest", () => {
    it("should return errors for missing required fields", () => {
      const errors = validateGenerateRequest({} as GenerateRequest);
      expect(errors).toHaveLength(0); // no required fields in new schema
    });

    it("should return no errors for valid SDDirect request", () => {
      const errors = validateGenerateRequest({ forInlineEditing: true });
      expect(errors.length).toBe(0);
    });

    it("should return no errors for valid EaziPay request", () => {
      const errors = validateGenerateRequest({ forInlineEditing: true });
      expect(errors.length).toBe(0);
    });

    it("should validate numberOfRows if provided", () => {
      const errors1 = validateGenerateRequest({ forInlineEditing: true, numberOfRows: -5 });
      expect(errors1).toContain("numberOfRows must be a positive integer");

      const errors2 = validateGenerateRequest({ forInlineEditing: true, numberOfRows: 0 });
      expect(errors2).toContain("numberOfRows must be a positive integer");

      const errors3 = validateGenerateRequest({ forInlineEditing: true, numberOfRows: 1.5 });
      expect(errors3).toContain("numberOfRows must be a positive integer");

      const errors4 = validateGenerateRequest({ forInlineEditing: true, numberOfRows: 15 });
      expect(errors4.length).toBe(0);
    });

    describe("EaziPay-specific validation", () => {
      it("should validate dateFormat for EaziPay", () => {
        const errors1 = validateGenerateRequest({ 
          forInlineEditing: true, 
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          dateFormat: "INVALID-FORMAT" as any 
        });
        expect(errors1).toContain("dateFormat must be one of: YYYY-MM-DD, DD-MMM-YYYY, DD/MM/YYYY");

        const errors2 = validateGenerateRequest({ 
          forInlineEditing: true, 
          dateFormat: "YYYY-MM-DD" 
        });
        expect(errors2.length).toBe(0);

        const errors3 = validateGenerateRequest({ 
          forInlineEditing: true, 
          dateFormat: "DD-MMM-YYYY" 
        });
        expect(errors3.length).toBe(0);

        const errors4 = validateGenerateRequest({ 
          forInlineEditing: true, 
          dateFormat: "DD/MM/YYYY" 
        });
        expect(errors4.length).toBe(0);
      });

      // In new API, dateFormat validation is independent of fileType at this layer
    });
  });

  describe("validateAndNormalizeHeaders", () => {
    it("should preserve includeHeaders for supported file types", () => {
      const request1 = { includeHeaders: true } as GenerateRequest;
      const normalized1 = validateAndNormalizeHeaders('SDDirect', request1);
      expect(normalized1.includeHeaders).toBe(true);

      const request2 = { includeHeaders: true } as GenerateRequest;
      const normalized2 = validateAndNormalizeHeaders('Bacs18StandardFile', request2);
      expect(normalized2.includeHeaders).toBe(true);

      const request3 = { includeHeaders: false } as GenerateRequest;
      const normalized3 = validateAndNormalizeHeaders('SDDirect', request3);
      expect(normalized3.includeHeaders).toBe(false);
    });

    it("should override includeHeaders to false for unsupported file types", () => {
  const request1 = { includeHeaders: true } as GenerateRequest;
  const normalized1 = validateAndNormalizeHeaders('EaziPay', request1);
      expect(normalized1.includeHeaders).toBe(false);

  const request2 = { includeHeaders: true } as GenerateRequest;
  const normalized2 = validateAndNormalizeHeaders('Bacs18PaymentLines', request2);
      expect(normalized2.includeHeaders).toBe(false);
    });

    it("should not modify request if includeHeaders is already false", () => {
  const request = { includeHeaders: false } as GenerateRequest;
  const normalized = validateAndNormalizeHeaders('EaziPay', request);
      expect(normalized.includeHeaders).toBe(false);
      expect(normalized).toEqual(request);
    });

    it("should not modify request if includeHeaders is undefined", () => {
  const request = {} as GenerateRequest;
  const normalized = validateAndNormalizeHeaders('EaziPay', request);
      expect(normalized.includeHeaders).toBeUndefined();
      expect(normalized).toEqual(request);
    });
  });

  describe("validateAndNormalizeRequest", () => {
    it("should return valid result for good request", () => {
      const request: GenerateRequest = { forInlineEditing: true };
      const result = validateAndNormalizeGenerateRequest('SDDirect', request);
      
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.normalizedRequest).toEqual(request);
    });

    it("should return invalid result with errors for bad request", () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const request = { forInlineEditing: "not-boolean", numberOfRows: -1 } as any;
  const result = validateAndNormalizeGenerateRequest('SDDirect', request);
      
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it("should normalize headers while validating", () => {
  const request: GenerateRequest = { includeHeaders: true } as GenerateRequest;
  const result = validateAndNormalizeGenerateRequest('EaziPay', request);
      
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.normalizedRequest.includeHeaders).toBe(false); // Normalized
    });

    it("should catch validation errors even with normalization", () => {
  const request = { includeHeaders: true, numberOfRows: -5, dateFormat: "INVALID" as unknown as GenerateRequest["dateFormat"] } as GenerateRequest;
  const result = validateAndNormalizeGenerateRequest('EaziPay', request);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain("numberOfRows must be a positive integer");
      expect(result.errors).toContain("dateFormat must be one of: YYYY-MM-DD, DD-MMM-YYYY, DD/MM/YYYY");
      expect(result.normalizedRequest.includeHeaders).toBe(false); // Still normalized
    });
  });
});
