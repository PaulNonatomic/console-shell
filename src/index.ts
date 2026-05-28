/**
 * console-shell — hide a styled CLI inside your site's
 * developer console.
 *
 * Public API:
 *   - `createShell(config)`       — window-namespaced CLI surface
 *   - `DEFAULT_THEME`             — phosphor-on-void palette
 *   - `resolveTheme(partial)`     — merge a partial over defaults
 *
 * Types (Theme, Banner, Command, ShellConfig, ShellLogger) are
 * re-exported as type-only so consumers can declare configs
 * with full IDE support without the runtime cost of importing
 * the implementation modules.
 *
 * Looking for a branching text-adventure engine that plugs
 * into this shell? See the companion package
 * `console-adventure`.
 */

export { createShell } from './shell.js';
export type { Shell, ShellPlugin } from './shell.js';

export { DEFAULT_THEME, resolveTheme } from './theme.js';

// Style helpers — public so consumers (and downstream
// libraries like console-adventure) can build their own
// styled console.log calls in the shell's theme without
// re-implementing the small CSS-string builders. Banner /
// wordmark styles are intentionally not exported (banner.ts
// owns the banner-rendering contract).
export { colorFor, styleFor, styleBoldFor } from './style.js';

export type {
	Theme,
	ThemeColor,
	Banner,
	Command,
	ShellConfig,
	ShellLogger
} from './types.js';
