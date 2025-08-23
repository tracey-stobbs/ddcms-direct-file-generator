import { describe, it, expect } from 'vitest';
import { DateTime } from 'luxon';
import { IsBankHoliday, IsWorkingDay, AddWorkingDays } from '../lib/calendar';

describe('Calendar Service', () => {
    describe('IsBankHoliday', () => {
        it("should identify New Year's Day 2025 as a bank holiday", () => {
            const newYearsDay = DateTime.fromFormat('20250101', 'yyyyMMdd');
            expect(IsBankHoliday(newYearsDay)).toBe(true);
        });

        it('should identify Christmas Day 2025 as a bank holiday', () => {
            const christmasDay = DateTime.fromFormat('20251225', 'yyyyMMdd');
            expect(IsBankHoliday(christmasDay)).toBe(true);
        });

        it('should identify a regular weekday as not a bank holiday', () => {
            const regularDay = DateTime.fromFormat('20250220', 'yyyyMMdd'); // Thursday
            expect(IsBankHoliday(regularDay)).toBe(false);
        });
    });

    describe('IsWorkingDay', () => {
        it('should identify a regular weekday as a working day', () => {
            const regularDay = DateTime.fromFormat('20250220', 'yyyyMMdd'); // Thursday
            expect(IsWorkingDay(regularDay)).toBe(true);
        });

        it('should identify Saturday as not a working day', () => {
            const saturday = DateTime.fromFormat('20250222', 'yyyyMMdd'); // Saturday
            expect(IsWorkingDay(saturday)).toBe(false);
        });

        it('should identify Sunday as not a working day', () => {
            const sunday = DateTime.fromFormat('20250223', 'yyyyMMdd'); // Sunday
            expect(IsWorkingDay(sunday)).toBe(false);
        });

        it('should identify a bank holiday as not a working day', () => {
            const newYearsDay = DateTime.fromFormat('20250101', 'yyyyMMdd');
            expect(IsWorkingDay(newYearsDay)).toBe(false);
        });
    });

    describe('AddWorkingDays', () => {
        it('should add 3 working days correctly', () => {
            const startDate = DateTime.fromFormat('20250220', 'yyyyMMdd'); // Thursday
            const result = AddWorkingDays(startDate, 3);
            const expected = DateTime.fromFormat('20250225', 'yyyyMMdd'); // Tuesday (skipping weekend)
            expect(result.toFormat('yyyyMMdd')).toBe(expected.toFormat('yyyyMMdd'));
        });

        it('should handle adding working days over a weekend', () => {
            const startDate = DateTime.fromFormat('20250221', 'yyyyMMdd'); // Friday
            const result = AddWorkingDays(startDate, 2);
            const expected = DateTime.fromFormat('20250225', 'yyyyMMdd'); // Tuesday
            expect(result.toFormat('yyyyMMdd')).toBe(expected.toFormat('yyyyMMdd'));
        });
    });
});
