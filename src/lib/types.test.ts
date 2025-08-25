import { describe, expect, it } from 'vitest';
import type {
  EaziPayDateFormat,
  EaziPaySpecificFields,
  ErrorResponse,
  Request,
  SuccessResponse,
} from './types';

describe('Type Definitions', () => {
  describe('EaziPayDateFormat', () => {
    it('should accept valid date formats', () => {
      const formats: EaziPayDateFormat[] = [
        "YYYY-MM-DD",
        "DD-MMM-YYYY", 
        "DD/MM/YYYY"
      ];
      
      expect(formats).toHaveLength(3);
      expect(formats).toContain("YYYY-MM-DD");
      expect(formats).toContain("DD-MMM-YYYY");
      expect(formats).toContain("DD/MM/YYYY");
    });
  });

  // Trailer concept removed; trailing columns are always empty strings in formatting

  describe('Request Interface', () => {
    it('should support EaziPay fileType', () => {
      const eaziPayRequest: Request = {
        fileType: "EaziPay",
        canInlineEdit: true,
        includeHeaders: false,
        numberOfRows: 15,
        hasInvalidRows: false,
        dateFormat: "YYYY-MM-DD"
      };

      expect(eaziPayRequest.fileType).toBe("EaziPay");
      expect(eaziPayRequest.dateFormat).toBe("YYYY-MM-DD");
    });

    it('should make dateFormat optional', () => {
      const requestWithoutDateFormat: Request = {
        fileType: "EaziPay",
        canInlineEdit: true
      };

      expect(requestWithoutDateFormat.dateFormat).toBeUndefined();
    });

    it('should support all existing fileTypes', () => {
      const fileTypes = ["SDDirect", "Bacs18PaymentLines", "Bacs18StandardFile", "EaziPay"] as const;
      
      fileTypes.forEach(fileType => {
        const request: Request = {
          fileType,
          canInlineEdit: true
        };
        expect(request.fileType).toBe(fileType);
      });
    });
  });

  describe('EaziPaySpecificFields', () => {
    it('should define all required EaziPay fields', () => {
      const fields: EaziPaySpecificFields = {
        transactionCode: "17",
        originatingSortCode: "912291",
        originatingAccountNumber: "51491194",
        destinationSortCode: "123456",
        destinationAccountNumber: "12345678",
        destinationAccountName: "Test Company",
        paymentReference: "DDREF01",
        amount: 15540,
        fixedZero: 0,
        processingDate: "2025-07-23",
        empty: undefined,
        sunName: "Test Company",
        sunNumber: undefined,
        // optional trailing empties are not explicit fields on the object
      };

      expect(fields.transactionCode).toBe("17");
      expect(fields.fixedZero).toBe(0);
      expect(fields.empty).toBeUndefined();
      expect(fields.sunNumber).toBeUndefined();
    });

    it('should allow sunNumber to be optional', () => {
      const fieldsWithSunNumber: EaziPaySpecificFields = {
        transactionCode: "0C",
        originatingSortCode: "912291",
        originatingAccountNumber: "51491194",
        destinationSortCode: "123456",
        destinationAccountNumber: "12345678",
        destinationAccountName: "Test Company",
        paymentReference: "DDREF01",
        amount: 0,
        fixedZero: 0,
        processingDate: "2025-07-25",
        empty: undefined,
        sunName: "Test Company",
        sunNumber: "12345",
        // trailer removed
      };

      const fieldsWithoutSunNumber: EaziPaySpecificFields = {
        transactionCode: "17",
        originatingSortCode: "912291",
        originatingAccountNumber: "51491194",
        destinationSortCode: "123456",
        destinationAccountNumber: "12345678",
        destinationAccountName: "Test Company",
        paymentReference: "DDREF01",
        amount: 15540,
        fixedZero: 0,
        processingDate: "2025-07-23",
        empty: undefined,
        sunName: "Test Company",
        // trailer removed
      };

      expect(fieldsWithSunNumber.sunNumber).toBe("12345");
      expect(fieldsWithoutSunNumber.sunNumber).toBeUndefined();
    });
  });

  describe('Response Interfaces', () => {
    it('should define SuccessResponse correctly', () => {
      const successResponse: SuccessResponse = {
        success: true,
        fileContent: "A,B,C\n1,2,3\n",
      };

      expect(successResponse.success).toBe(true);
  expect(successResponse.fileContent).toContain("A,B,C");
    });

    it('should define ErrorResponse correctly', () => {
      const errorResponse: ErrorResponse = {
        success: false,
        error: "Validation failed"
      };

      expect(errorResponse.success).toBe(false);
      expect(errorResponse.error).toBe("Validation failed");
    });
  });
});
