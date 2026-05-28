/**
 * Style-string builders for `console.log("%c...", style)`.
 *
 * The shell calls `console.log` everywhere — but the *strings*
 * it passes as styles are built here, in one place, so
 * consumers can theme the whole UI by swapping the Theme
 * object without the runtime ever having to know which colour
 * is "lime" and which is "amber".
 *
 * Adventure-specific styles (scene heading, narration, choices,
 * result callouts, finish banner) used to live here too but
 * have moved to the `console-adventure` package.
 */
import type { Theme, ThemeColor } from './types.js';

/** Base font declaration shared by every style. */
function baseFont(theme: Theme): string {
	return `font-family: ${theme.fontFamily}; font-size: ${theme.fontSize};`;
}

/** Resolve a theme-colour slot name to its CSS value. */
export function colorFor(theme: Theme, slot: ThemeColor): string {
	return theme[slot];
}

/** Plain text in a chosen theme colour. */
export function styleFor(theme: Theme, slot: ThemeColor): string {
	return `color: ${colorFor(theme, slot)}; ${baseFont(theme)}`;
}

/** Bold variant of `styleFor`. */
export function styleBoldFor(theme: Theme, slot: ThemeColor): string {
	return `color: ${colorFor(theme, slot)}; font-weight: bold; ${baseFont(theme)}`;
}

/**
 * Style for the banner art — primary colour, tight line-height
 * so multi-line ASCII/Unicode silhouettes read as a unified
 * block, no background (intentionally — see Banner.art docs).
 */
export function styleBanner(theme: Theme): string {
	return `color: ${theme.primary}; line-height: 1.0; ${baseFont(theme)}`;
}

/**
 * Style for the wordmark caption under the banner art — primary
 * colour, letter-spaced so it reads as a wordmark rather than
 * normal text.
 */
export function styleWordmark(theme: Theme): string {
	return `color: ${theme.primary}; letter-spacing: 0.4em; font-weight: bold; ${baseFont(theme)}`;
}
