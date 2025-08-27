import { describe, it, expect } from 'vitest';
import { getFileGenerator } from './factory';

describe('File Generator Factory', () => {
  describe('getFileGenerator', () => {
    it('should return generator for SDDirect', () => {
      const generator = getFileGenerator('SDDirect');
      expect(generator).toBeDefined();
      expect(typeof generator).toBe('function');
    });

    it('should return generator for EaziPay', () => {
      const generator = getFileGenerator('EaziPay');
      expect(generator).toBeDefined();
      expect(typeof generator).toBe('function');
    });

    it('should throw error for unknown file type', () => {
      expect(() => {
        getFileGenerator('UnknownType');
      }).toThrow('Unknown file type: UnknownType');
    });

    it('should throw error for empty string', () => {
      expect(() => {
        getFileGenerator('');
      }).toThrow('Unknown file type: ');
    });

    it('should handle case-sensitive file types', () => {
      expect(() => {
        getFileGenerator('sddirect'); // lowercase
      }).toThrow('Unknown file type: sddirect');

      expect(() => {
        getFileGenerator('eazipay'); // lowercase
      }).toThrow('Unknown file type: eazipay');
    });
  });
});
