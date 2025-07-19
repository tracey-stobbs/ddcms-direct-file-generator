/**
 * Simple test to verify imports work
 */

import { describe, it, expect } from 'vitest';

describe('Import Test', () => {
  it('should import types successfully', async () => {
    const types = await import('../types/sddirect.js');
    expect(types).toBeDefined();
    expect(types.VALIDATION_CONSTANTS).toBeDefined();
  });

  it('should import validation service successfully', async () => {
    const validation = await import('../services/validation.js');
    expect(validation).toBeDefined();
    expect(validation.ValidationService).toBeDefined();
  });
});
