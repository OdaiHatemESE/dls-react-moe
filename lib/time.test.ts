import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest';
import { timeAgo } from './time';

describe('timeAgo', () => {
  // Store original Date.now
  const realDateNow = Date.now;

  beforeEach(() => {
    // Mock Date.now to have consistent test results
    // Let's say "now" is Jan 1, 2025 12:00:00
    vi.spyOn(Date, 'now').mockReturnValue(new Date('2025-01-01T12:00:00Z').getTime());
  });

  afterEach(() => {
    // Restore original Date.now
    vi.restoreAllMocks();
  });

  test('returns "unknown" for null input', () => {
    expect(timeAgo(null)).toBe('unknown');
  });

  test('returns "unknown" for undefined input', () => {
    expect(timeAgo(undefined)).toBe('unknown');
  });

  test('returns "unknown" for invalid date string', () => {
    expect(timeAgo('not-a-date')).toBe('unknown');
  });

  test('shows seconds ago for very recent times (< 1 minute)', () => {
    // 30 seconds ago
    const timestamp = new Date('2025-01-01T11:59:30Z').toISOString();
    expect(timeAgo(timestamp)).toBe('30s ago');
  });

  test('shows 0s ago for current time', () => {
    const timestamp = new Date('2025-01-01T12:00:00Z').toISOString();
    expect(timeAgo(timestamp)).toBe('0s ago');
  });

  test('shows minutes ago for times < 1 hour', () => {
    // 15 minutes ago
    const timestamp = new Date('2025-01-01T11:45:00Z').toISOString();
    expect(timeAgo(timestamp)).toBe('15m ago');
  });

  test('shows hours ago for times < 24 hours', () => {
    // 5 hours ago
    const timestamp = new Date('2025-01-01T07:00:00Z').toISOString();
    expect(timeAgo(timestamp)).toBe('5h ago');
  });

  test('shows days ago for times >= 24 hours', () => {
    // 3 days ago
    const timestamp = new Date('2024-12-29T12:00:00Z').toISOString();
    expect(timeAgo(timestamp)).toBe('3d ago');
  });

  test('handles future dates gracefully (returns 0s)', () => {
    // 1 hour in the future
    const timestamp = new Date('2025-01-01T13:00:00Z').toISOString();
    // Math.max(0, ...) ensures we don't show negative time
    expect(timeAgo(timestamp)).toBe('0s ago');
  });

  test('handles edge case: exactly 1 minute', () => {
    const timestamp = new Date('2025-01-01T11:59:00Z').toISOString();
    expect(timeAgo(timestamp)).toBe('1m ago');
  });

  test('handles edge case: exactly 1 hour', () => {
    const timestamp = new Date('2025-01-01T11:00:00Z').toISOString();
    expect(timeAgo(timestamp)).toBe('1h ago');
  });

  test('handles edge case: exactly 1 day', () => {
    const timestamp = new Date('2024-12-31T12:00:00Z').toISOString();
    expect(timeAgo(timestamp)).toBe('1d ago');
  });
});
