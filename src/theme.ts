/**
 * Default theme — phosphor lime + amber + magenta + cyan on
 * near-void. Reads well in both dark- and light-theme dev
 * tools because the colours are saturated enough to hold their
 * own against either background.
 *
 * Consumers can override any field via `theme:` in ShellConfig;
 * `resolveTheme(partial)` deep-merges over this default.
 */
import type { Theme } from './types.js';

export const DEFAULT_THEME: Theme = {
	primary: '#C7F441',
	accent: '#F5A623',
	danger: '#FF388F',
	info: '#00D4FF',
	text: '#eef0f5',
	dim: '#909090',
	background: '#0A0A0F',
	fontFamily: 'ui-monospace, "JetBrains Mono", Menlo, Consolas, monospace',
	fontSize: '12px'
};

/**
 * Merge a partial theme over the defaults. Defined as a small
 * pure function (instead of inline `{...DEFAULT_THEME, ...t}`)
 * so consumers don't have to remember to spread defaults.
 */
export function resolveTheme(theme?: Partial<Theme>): Theme {
	return { ...DEFAULT_THEME, ...(theme ?? {}) };
}
