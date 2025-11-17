import { describe, test, expect } from 'vitest';
import { cn } from './utils';

describe('cn (className merger)', () => {
  test('merges single class name', () => {
    expect(cn('text-red-500')).toBe('text-red-500');
  });

  test('merges multiple class names', () => {
    expect(cn('text-red-500', 'bg-blue-500')).toBe('text-red-500 bg-blue-500');
  });

  test('handles empty strings and ignores them', () => {
    expect(cn('text-red-500', '', 'bg-blue-500')).toBe('text-red-500 bg-blue-500');
  });

  test('handles undefined and null gracefully', () => {
    expect(cn('text-red-500', undefined, null, 'bg-blue-500')).toBe('text-red-500 bg-blue-500');
  });

  test('merges conflicting Tailwind classes (later wins)', () => {
    // twMerge should make later class win
    const result = cn('text-red-500', 'text-blue-500');
    expect(result).toBe('text-blue-500');
  });

  test('handles conditional classes with clsx pattern', () => {
    const isActive = true;
    const result = cn('base-class', isActive && 'active-class');
    expect(result).toBe('base-class active-class');
  });

  test('handles conditional classes when false', () => {
    const isActive = false;
    const result = cn('base-class', isActive && 'active-class');
    expect(result).toBe('base-class');
  });

  test('handles object syntax for conditional classes', () => {
    const result = cn({
      'base-class': true,
      'active': true,
      'disabled': false,
    });
    expect(result).toBe('base-class active');
  });

  test('handles array of classes', () => {
    const result = cn(['text-red-500', 'bg-blue-500']);
    expect(result).toBe('text-red-500 bg-blue-500');
  });

  test('handles complex real-world scenario', () => {
    const isDisabled = false;
    const variant: 'primary' | 'secondary' = 'primary';
    
    const result = cn(
      'base-button',
      'px-4 py-2',
      variant === 'primary' && 'bg-blue-500 text-white',
      variant === 'secondary' && 'bg-gray-500 text-white',
      isDisabled && 'opacity-50 cursor-not-allowed'
    );
    
    expect(result).toBe('base-button px-4 py-2 bg-blue-500 text-white');
  });

  test('handles no arguments', () => {
    expect(cn()).toBe('');
  });

  test('deduplicates same classes', () => {
    const result = cn('text-red-500', 'text-red-500');
    // twMerge should deduplicate
    expect(result).toBe('text-red-500');
  });

  test('correctly merges responsive classes', () => {
    const result = cn('text-sm md:text-lg', 'lg:text-xl');
    expect(result).toContain('text-sm');
    expect(result).toContain('md:text-lg');
    expect(result).toContain('lg:text-xl');
  });

  test('handles mixed input types', () => {
    const result = cn(
      'base',
      ['array-class'],
      { 'object-class': true },
      'string-class',
      null,
      undefined,
      false && 'conditional'
    );
    expect(result).toContain('base');
    expect(result).toContain('array-class');
    expect(result).toContain('object-class');
    expect(result).toContain('string-class');
  });
});
