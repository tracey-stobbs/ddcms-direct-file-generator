import type { OriginatingAccountDetails } from '../types';

// Simple in-memory SUN -> originating account details map.
// Extend as needed or fetch from config/DB in future.
const REGISTRY: Record<string, OriginatingAccountDetails> = {
  // Example defaults; override by passing specific SUN in request params
  DEFAULT: {
    canBeInvalid: true,
    sortCode: '912291',
    accountNumber: '51491194',
    accountName: 'Test Account',
  },
};

export function registerSun(sun: string, details: OriginatingAccountDetails): void {
  REGISTRY[sun.toUpperCase()] = details;
}

export function getOriginatingDetailsForSun(sun: string): OriginatingAccountDetails {
  return REGISTRY[sun.toUpperCase()] ?? REGISTRY.DEFAULT;
}
