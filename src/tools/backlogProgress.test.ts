import { describe, expect, it } from 'vitest';
import { parseBacklogMarkdown, renderDashboard, updateBacklogDashboard } from './backlogProgress';

const sample = `
# Backlog

Legend

- Priority: P0 (Critical)
- Size: XS (<0.5d)
- Status: To Do | In Progress | Blocked | Review | Done
- Traffic Light: 🟢 Done · 🟡 In Progress/Review · 🔴 Blocked · ⚪ To Do

## epic E1: Alpha (M1)
- Priority: P0, Size: S, Status: Done 🟢
- Priority: P1, Size: XS, Status: Done

## epic E2: Beta (M1)
- Priority: P0, Size: XS, Status: To Do ⚪
- Priority: P0, Size: XS, Status: Blocked 🔴

## open questions (track as blocked tasks)
- 🔴 Q1: Something blocked
- Q2: Not blocked
`;

describe('tools/backlogProgress', () => {
    it('parses epics and counts lights', () => {
        const { epics, overall, openQuestions } = parseBacklogMarkdown(sample);
        expect(epics.length).toBe(2);
        expect(epics[0].code).toBe('E1');
        expect(epics[0].counts.green).toBe(2); // one uses implicit Done
        expect(epics[1].counts.white).toBe(1);
        expect(epics[1].counts.red).toBe(1);
        expect(openQuestions.red).toBe(1);
        expect(overall.green).toBe(2);
        expect(overall.red).toBe(2); // includes open questions
    });

    it('renders dashboard table with totals', () => {
        const { epics, overall, openQuestions } = parseBacklogMarkdown(sample);
        const dash = renderDashboard(epics, overall, openQuestions);
        expect(dash).toContain('## progress dashboard');
        expect(dash).toContain(
            '| Scope | 🟢 Done | 🟡 In Progress/Review | 🔴 Blocked | ⚪ To Do |',
        );
        expect(dash).toContain('Overall');
        expect(dash).toContain('E1 Alpha');
    });

    it('updates markdown by inserting dashboard', () => {
        const updated = updateBacklogDashboard(sample);
        expect(updated).toContain('## progress dashboard');
        // Should only have one dashboard
        expect(updated.match(/## progress dashboard/g)?.length).toBe(1);
    });
});
