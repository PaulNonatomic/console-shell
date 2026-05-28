import { describe, it, expect } from 'vitest';
import { DEFAULT_THEME, resolveTheme } from '../src/theme.js';

describe('resolveTheme', () => {
	it('returns the default theme when called with nothing', () => {
		expect(resolveTheme()).toEqual(DEFAULT_THEME);
	});

	it('returns the default theme when called with an empty object', () => {
		expect(resolveTheme({})).toEqual(DEFAULT_THEME);
	});

	it('merges a partial override over the defaults', () => {
		const merged = resolveTheme({ primary: '#ff0000', accent: '#00ff00' });
		expect(merged.primary).toBe('#ff0000');
		expect(merged.accent).toBe('#00ff00');
		// untouched fields inherit defaults
		expect(merged.danger).toBe(DEFAULT_THEME.danger);
		expect(merged.background).toBe(DEFAULT_THEME.background);
		expect(merged.fontFamily).toBe(DEFAULT_THEME.fontFamily);
	});

	it('does not mutate the default theme', () => {
		const before = { ...DEFAULT_THEME };
		resolveTheme({ primary: '#abc' });
		expect(DEFAULT_THEME).toEqual(before);
	});
});
