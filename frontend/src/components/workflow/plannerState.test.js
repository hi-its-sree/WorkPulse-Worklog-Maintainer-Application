import { describe, expect, it } from 'vitest';
import { normalizeMeetings, normalizeSection, normalizeTasks } from './plannerState.js';

describe('planner state normalization', () => {
  it('normalizes malformed stored task data without crashing', () => {
    const normalized = normalizeTasks([undefined, null, { title: 'Review', planned: 90 }, { title: 'Morning assembly', planned: 60, isMorningAssembly: true }]);

    expect(Array.isArray(normalized)).toBe(true);
    expect(normalized[0].title).toBe('Morning assembly');
    expect(normalized[1].title).toBe('Review');
    expect(normalized[1].planned).toBe(90);
  });

  it('keeps morning assembly optional when the saved plan does not include it', () => {
    const normalized = normalizeTasks([{ title: 'Review', planned: 90 }]);

    expect(normalized).toHaveLength(1);
    expect(normalized[0].title).toBe('Review');
  });

  it('normalizes malformed section and meeting data', () => {
    const section = normalizeSection({ planned: 45, description: 'Docs' });
    const meetings = normalizeMeetings([undefined, { title: 'Sync', from: '09:00', to: '10:00' }]);

    expect(section.planned).toBe(45);
    expect(section.description).toBe('Docs');
    expect(meetings).toHaveLength(1);
    expect(meetings[0].title).toBe('Sync');
  });
});
