/**
 * Validation Service Tests
 */

import { describe, it, expect } from 'vitest';

describe('Validation System', () => {
  it('should test validation constants', async () => {
    const { VALIDATION_CONSTANTS } = await import('../types/sddirect');
    
    expect(VALIDATION_CONSTANTS.SERVICE_USER_NUMBER.LENGTH).toBe(6);
    expect(VALIDATION_CONSTANTS.SORT_CODE.LENGTH).toBe(6);
    expect(VALIDATION_CONSTANTS.ACCOUNT_NUMBER.MAX_LENGTH).toBe(8);
  });

  it('should create validation service', async () => {
    const { ValidationService } = await import('../services/validation');
    
    const service = ValidationService.getInstance();
    expect(service).toBeDefined();
    expect(service.isFormatSupported('sddirect')).toBe(true);
  });

  it('should validate a simple record structure', async () => {
    const { ValidationService } = await import('../services/validation');
    
    const service = ValidationService.getInstance();
    const validRecord = {
      transactionId: 'TXN-001',
      serviceUserNumber: '123456',
      payerSortCode: '112233',
      payerAccountNumber: '12345678',
      payerName: 'John Smith',
      collectionAmount: 1500,
      collectionDate: '2025-08-15',
      reference: 'INV-001',
      ddiReference: 'DDI-REF-001'
    };

    const result = service.validateRecord('sddirect', validRecord);
    expect(result.success).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('should reject invalid service user number', async () => {
    const { ValidationService } = await import('../services/validation');
    
    const service = ValidationService.getInstance();
    const invalidRecord = {
      transactionId: 'TXN-001',
      serviceUserNumber: '12345', // Too short
      payerSortCode: '112233',
      payerAccountNumber: '12345678',
      payerName: 'John Smith',
      collectionAmount: 1500,
      collectionDate: '2025-08-15',
      reference: 'INV-001',
      ddiReference: 'DDI-REF-001'
    };

    const result = service.validateRecord('sddirect', invalidRecord);
    expect(result.success).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
  });
});
