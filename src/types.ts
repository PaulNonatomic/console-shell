/**
 * Public types for console-quest.
 *
 * The library exposes two composable factories:
 *   - `createShell(...)` for a window-namespaced CLI surface
 *     with a banner, theming and user-defined commands
 *   - `createAdventure(...)` for a branching choice-based
 *     narrative that prints to console.log and is driven by
 *     `.choose(n)` calls
 *
 * Both are configured via plain-object configs declared here.
 * Nothing in this file imports anything else — keeping the type
 * surface free of implementation lets consumers depend on just
 * these interfaces without dragging the whole runtime in.
 */

/**
 * Theme palette used by the shell and the adventure when they
 * style their `%c` log output. Every field is a CSS colour
 * string — hex, rgb(), hsl(), CSS variable, anything that
 * `color:`/`background:` accept.
 *
 * Defaults ship a phosphor-on-void palette (lime + amber +
 * magenta + cyan on a near-black background) that reads
 * cleanly in both dark- and light-theme dev tools.
 */
export interface Theme {
	/** Brand primary — headings, banner, "right answer" accents. */
	primary: string;
	/** Attention colour — choices, result callouts, hints. */
	accent: string;
	/** Strong/terminal colour — finish state, share CTAs. */
	danger: string;
	/** Secondary info colour — tagline, links, sub-headings. */
	info: string;
	/** Body / narration text. */
	text: string;
	/** Muted text — dividers, prompts, footnotes. */
	dim: string;
	/** CSS background colour for `%c` blocks that need a void fill. */
	background: string;
	/** CSS font-family stack. Should be monospace for ASCII art to line up. */
	fontFamily: string;
	/** Base font-size string, e.g. `"12px"`. */
	fontSize: string;
}

/** Theme slot names — used to refer to a colour by role. */
export type ThemeColor = 'primary' | 'accent' | 'danger' | 'info' | 'text' | 'dim';

/**
 * Opening banner rendered when the shell installs. Every field
 * is optional — pass `{}` to suppress the banner entirely (the
 * commands and adventure still install silently). The fields
 * render top-to-bottom in this order.
 */
export interface Banner {
	/**
	 * Multi-line ASCII or Unicode art. Rendered in the theme's
	 * `primary` colour. Best with Unicode block characters (█, ▓)
	 * rather than `#` — block characters fill their cell so the
	 * silhouette reads as a clean shape.
	 */
	art?: string;
	/**
	 * Wordmark caption rendered below the art, in primary, with
	 * letter-spacing applied so it reads as a brand mark rather
	 * than running text.
	 */
	wordmark?: string;
	/** Tagline under the wordmark, in the `info` colour. */
	tagline?: string;
	/**
	 * One-line hint about how to discover more — typically
	 * something like `"try mybrand.help()"`. Rendered in
	 * `accent` colour bold so it pulls the eye.
	 */
	hint?: string;
}

/**
 * A user-defined command registered on the shell. The `name`
 * key is the property name on the window namespace (e.g. the
 * `about` key becomes `mybrand.about()`).
 */
export interface Command {
	/** Short description shown in the auto-generated help screen. */
	description: string;
	/**
	 * Optional theme colour used to tint the command's name in
	 * the help listing. Defaults to `primary`.
	 */
	color?: ThemeColor;
	/**
	 * What runs when the command is invoked. Args passed in
	 * from the console are forwarded verbatim — so a command
	 * like `choose(n)` can be declared with a `(n: number)`
	 * handler.
	 */
	run: (...args: unknown[]) => void;
}

export interface ShellConfig {
	/**
	 * Window property name. The shell attaches an object at
	 * `window[namespace]` exposing the registered commands.
	 * Pick something short and brandable, e.g. `'nonatomic'`.
	 */
	namespace: string;
	/** Banner to render on install. Omit to install silently. */
	banner?: Banner;
	/** Theme overrides. Anything you don't set falls back to defaults. */
	theme?: Partial<Theme>;
	/** Commands keyed by property name. */
	commands?: Record<string, Command>;
	/**
	 * Hook fired every time a command is invoked. The first arg
	 * is the command name; useful for analytics / debugging.
	 * Stays optional so consumers can wire it to Vercel,
	 * Plausible, PostHog, console.log, or nothing.
	 */
	onCommand?: (commandName: string) => void;
	/**
	 * Optional logger override. Defaults to `globalThis.console`.
	 * Tests pass a stub here to capture output.
	 */
	logger?: ShellLogger;
}

/**
 * Minimal logger contract — the runtime only ever calls
 * `.log(message, ...styles)`. `console` satisfies this directly.
 */
export interface ShellLogger {
	log: (message: string, ...styles: string[]) => void;
}

/**
 * One option presented to the player in a scene. The chosen
 * option's `points` (if any) is added to the player's score,
 * its `flavour` is printed as a result callout, then the game
 * advances to the scene named in `next` (or finishes if `next`
 * is `null`).
 */
export interface Choice {
	/** Display text shown after the choice index. */
	label: string;
	/**
	 * Score added on selection. Omit for a no-score narrative.
	 * Mixed scoring across choices is fine.
	 */
	points?: number;
	/**
	 * Result text rendered in a callout after the choice is
	 * selected — the "what just happened" line. Skipped if
	 * absent (the game advances straight to the next scene).
	 */
	flavour?: string;
	/**
	 * Next scene id, or `null` to end the game. Branching
	 * narratives use this; linear narratives can keep the same
	 * `next` across all of a scene's choices.
	 */
	next: string | null;
}

/** A single beat in the narrative. */
export interface Scene {
	/** Heading shown in primary, e.g. `"~/foundry · entrance"`. */
	heading: string;
	/** Lines of body text. Each entry is one console.log line. */
	narration: string[];
	/** Choices the player can pick via `.choose(n)`. */
	choices: Choice[];
}

/**
 * Score-to-label mapping for the end-of-game tier. Listed
 * lowest-to-highest or highest-to-lowest, the resolver picks
 * the entry whose `minScore` is the highest one still <= the
 * player's final score.
 */
export interface Tier {
	minScore: number;
	label: string;
	color?: ThemeColor;
}

/**
 * Share configuration. When present and the player has
 * finished, the shell exposes a `.share()` command that builds
 * the URL and opens it.
 */
export interface ShareConfig {
	/** Pre-filled tweet/post text. */
	text: (args: { score: number; max: number; tier: string }) => string;
	/** URL appended to the post (usually a brag landing page). */
	url: (args: { score: number; tier: string }) => string;
	/**
	 * Build the share intent URL given the text + url. Defaults
	 * to X (Twitter) intent. Override for Mastodon / LinkedIn /
	 * custom share endpoints.
	 */
	intent?: (text: string, url: string) => string;
}

export interface AdventureConfig {
	/** Scene id where startGame() begins. */
	start: string;
	/** Scene graph keyed by scene id. */
	scenes: Record<string, Scene>;
	/**
	 * Tier table. Optional — without tiers the finish callout
	 * shows just the raw score. Listed in any order; resolver
	 * picks the highest qualifying tier.
	 */
	tiers?: Tier[];
	/** Share intent configuration. Omit to disable `.share()`. */
	share?: ShareConfig;
	/**
	 * Optional analytics hooks. Each fires at most once per
	 * `start()` call (no stateful dedupe across replays — that's
	 * the consumer's job, if they want it).
	 */
	onStart?: () => void;
	onComplete?: (args: { score: number; max: number; tier: string }) => void;
	onShare?: (args: { score: number; max: number; tier: string }) => void;
	/**
	 * Optional intro printed once before the first scene on
	 * each `start()` call. Use it to tell the player how to
	 * play.
	 */
	intro?: string[];
}
