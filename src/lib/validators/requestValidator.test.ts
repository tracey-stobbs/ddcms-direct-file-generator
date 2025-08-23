import { describe, it, expect } from 'vitest';
import {
  validateRequest,
  validateAndNormalizeHeaders,
  validateAndNormalizeRequest,
} from './requestValidator.js';
import type { Request } from '../types';

describe('Request Validator', () => {
  describe('validateRequest', () => {
    it('should return errors for missing required fields', () => {
      const errors = validateRequest({} as Request);
      expect(errors).toContain('fileType is required');
      expect(errors).toContain('canInlineEdit must be boolean');
    });

    it('should return no errors for valid SDDirect request', () => {
      const errors = validateRequest({ fileType: 'SDDirect', canInlineEdit: true });
      expect(errors.length).toBe(0);
    });

    it('should return no errors for valid EaziPay request', () => {
      const errors = validateRequest({ fileType: 'EaziPay', canInlineEdit: true });
      expect(errors.length).toBe(0);
    });

    it('should validate fileType values', () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const errors = validateRequest({ fileType: 'InvalidType', canInlineEdit: true } as any);
      expect(errors).toContain(
        'fileType must be one of: SDDirect, Bacs18PaymentLines, Bacs18StandardFile, EaziPay'
      );
    });

    it('should validate numberOfRows if provided', () => {
      const errors1 = validateRequest({
        fileType: 'SDDirect',
        canInlineEdit: true,
        numberOfRows: -5,
      });
      expect(errors1).toContain('numberOfRows must be a positive integer');

      const errors2 = validateRequest({
        fileType: 'SDDirect',
        canInlineEdit: true,
        numberOfRows: 0,
      });
      expect(errors2).toContain('numberOfRows must be a positive integer');

      const errors3 = validateRequest({
        fileType: 'SDDirect',
        canInlineEdit: true,
        numberOfRows: 1.5,
      });
      expect(errors3).toContain('numberOfRows must be a positive integer');

      const errors4 = validateRequest({
        fileType: 'SDDirect',
        canInlineEdit: true,
        numberOfRows: 15,
      });
      expect(errors4.length).toBe(0);
    });

    describe('EaziPay-specific validation', () => {
      it('should validate dateFormat for EaziPay', () => {
        const errors1 = validateRequest({
          fileType: 'EaziPay',
          canInlineEdit: true,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          dateFormat: 'INVALID-FORMAT' as any,
        });
        expect(errors1).toContain('dateFormat must be one of: YYYY-MM-DD, DD-MMM-YYYY, DD/MM/YYYY');

        const errors2 = validateRequest({
          fileType: 'EaziPay',
          canInlineEdit: true,
          dateFormat: 'YYYY-MM-DD',
        });
        expect(errors2.length).toBe(0);

        const errors3 = validateRequest({
          fileType: 'EaziPay',
          canInlineEdit: true,
          dateFormat: 'DD-MMM-YYYY',
        });
        expect(errors3.length).toBe(0);

        const errors4 = validateRequest({
          fileType: 'EaziPay',
          canInlineEdit: true,
          dateFormat: 'DD/MM/YYYY',
        });
        expect(errors4.length).toBe(0);
      });

      it('should not validate dateFormat for non-EaziPay types', () => {
        const errors = validateRequest({
          fileType: 'SDDirect',
          canInlineEdit: true,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          dateFormat: 'INVALID-FORMAT' as any,
        });
        expect(errors.length).toBe(0); // dateFormat is ignored for non-EaziPay
      });
    });
  });

  describe('validateAndNormalizeHeaders', () => {
    it('should preserve includeHeaders for supported file types', () => {
      const request1: Request = { fileType: 'SDDirect', canInlineEdit: true, includeHeaders: true };
      const normalized1 = validateAndNormalizeHeaders(request1);
      expect(normalized1.includeHeaders).toBe(true);

      const request2: Request = {
        fileType: 'Bacs18StandardFile',
        canInlineEdit: true,
        includeHeaders: true,
      };
      const normalized2 = validateAndNormalizeHeaders(request2);
      expect(normalized2.includeHeaders).toBe(true);

      const request3: Request = {
        fileType: 'SDDirect',
        canInlineEdit: true,
        includeHeaders: false,
      };
      const normalized3 = validateAndNormalizeHeaders(request3);
      expect(normalized3.includeHeaders).toBe(false);
    });

    it('should override includeHeaders to false for unsupported file types', () => {
      const request1: Request = { fileType: 'EaziPay', canInlineEdit: true, includeHeaders: true };
      const normalized1 = validateAndNormalizeHeaders(request1);
      expect(normalized1.includeHeaders).toBe(false);

      const request2: Request = {
        fileType: 'Bacs18PaymentLines',
        canInlineEdit: true,
        includeHeaders: true,
      };
      const normalized2 = validateAndNormalizeHeaders(request2);
      expect(normalized2.includeHeaders).toBe(false);
    });

    it('should not modify request if includeHeaders is already false', () => {
      const request: Request = { fileType: 'EaziPay', canInlineEdit: true, includeHeaders: false };
      const normalized = validateAndNormalizeHeaders(request);
      expect(normalized.includeHeaders).toBe(false);
      expect(normalized).toEqual(request);
    });

    it('should not modify request if includeHeaders is undefined', () => {
      const request: Request = { fileType: 'EaziPay', canInlineEdit: true };
      const normalized = validateAndNormalizeHeaders(request);
      expect(normalized.includeHeaders).toBeUndefined();
      expect(normalized).toEqual(request);
    });
  });

  describe('validateAndNormalizeRequest', () => {
    it('should return valid result for good request', () => {
      const request: Request = { fileType: 'SDDirect', canInlineEdit: true };
      const result = validateAndNormalizeRequest(request);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.normalizedRequest).toEqual(request);
    });

    it('should return invalid result with errors for bad request', () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const request = { fileType: 'INVALID', canInlineEdit: 'not-boolean' } as any;
      const result = validateAndNormalizeRequest(request);

      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should normalize headers while validating', () => {
      const request: Request = { fileType: 'EaziPay', canInlineEdit: true, includeHeaders: true };
      const result = validateAndNormalizeRequest(request);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.normalizedRequest.includeHeaders).toBe(false); // Normalized
    });

    it('should catch validation errors even with normalization', () => {
      const request = {
        fileType: 'EaziPay',
        canInlineEdit: true,
        includeHeaders: true,
        numberOfRows: -5,
        dateFormat: 'INVALID',
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as any;
      const result = validateAndNormalizeRequest(request);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('numberOfRows must be a positive integer');
      expect(result.errors).toContain(
        'dateFormat must be one of: YYYY-MM-DD, DD-MMM-YYYY, DD/MM/YYYY'
      );
      expect(result.normalizedRequest.includeHeaders).toBe(false); // Still normalized
    });
  });
});
