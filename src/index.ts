/**
 * console-quest — brand-styled developer-console shells and
 * branching text adventures for the web.
 *
 * Public API:
 *   - `createShell(config)`       — window-namespaced CLI surface
 *   - `createAdventure(config)`   — branching scene-graph game
 *   - `DEFAULT_THEME`             — phosphor-on-void palette
 *   - `resolveTheme(partial)`     — merge a partial over defaults
 *   - Share intent builders for X / Mastodon / Bluesky
 *
 * Types (Theme, Banner, Command, Scene, Choice, Tier, …) are
 * re-exported as type-only so consumers can declare configs
 * with full IDE support without the runtime cost of importing
 * the implementation modules.
 */

export { createShell } from './shell.js';
export type { Shell, ShellPlugin } from './shell.js';

export { createAdventure } from './adventure.js';
export type { Adventure } from './adventure.js';

export { DEFAULT_THEME, resolveTheme } from './theme.js';

export {
	buildXIntent,
	buildMastodonIntent,
	buildBlueskyIntent
} from './share.js';

export type {
	Theme,
	ThemeColor,
	Banner,
	Command,
	ShellConfig,
	ShellLogger,
	Choice,
	Scene,
	Tier,
	ShareConfig,
	AdventureConfig
} from './types.js';
