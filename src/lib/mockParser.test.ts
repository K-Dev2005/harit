import { describe, it, expect, vi } from 'vitest';
import { clientSideMock, normalizeToParseResult } from './mockParser';

// Mock getAuthUserId
vi.mock('./auth', () => ({
  getAuthUserId: () => 'mock_user_123',
}));

describe('clientSideMock', () => {
  it('identifies transport from uber/ola keywords', () => {
    const res = clientSideMock('took an uber for 12 km');
    expect(res.activity_type).toBe('transport');
    expect(res.mode).toBe('petrol cab');
    expect(res.quantity).toBe(12);
    expect(res.co2_kg).toBe(2.52);
    expect(res.needs_clarification).toBe(false);
  });

  it('identifies food ordered online', () => {
    const res = clientSideMock('ordered chicken biryani from swiggy');
    expect(res.activity_type).toBe('food');
    expect(res.mode).toBe('non-veg meal');
    expect(res.needs_clarification).toBe(false);
  });

  it('requests clarification for vague terms', () => {
    const res = clientSideMock('something random');
    expect(res.needs_clarification).toBe(true);
    expect(res.clarification_question).toContain('Could you be more specific?');
  });
});

describe('normalizeToParseResult', () => {
  it('returns data directly if it already contains entry', () => {
    const data = { entry: { id: '123' }, needs_clarification: false };
    const res = normalizeToParseResult(data, 'some input');
    expect(res).toEqual(data);
  });

  it('builds entry payload from raw fields', () => {
    const raw = {
      activity_type: 'transport',
      mode: 'metro',
      quantity: 15,
      unit: 'km',
      co2_kg: 0.33,
    };
    const res = normalizeToParseResult(raw, 'travelled 15km in metro');
    expect(res.needs_clarification).toBe(false);
    expect(res.entry.userId).toBe('mock_user_123');
    expect(res.entry.category).toBe('transport');
    expect(res.entry.subcategory).toBe('metro');
    expect(res.entry.distanceKm).toBe(15);
    expect(res.entry.co2Kg).toBe(0.33);
  });
});
