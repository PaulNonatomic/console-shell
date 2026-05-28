/**
 * Public types for console-shell.
 *
 * The library exposes one factory — `createShell(...)` — for a
 * window-namespaced CLI surface with a banner, theming, and
 * user-defined commands. A separate package
 * (`console-adventure`) builds branching text adventures on
 * top, plugging in via the structural `ShellPlugin` interface
 * exported from `./shell`.
 *
 * Nothing in this file imports anything else — keeping the
 * type surface free of implementation lets consumers depend on
 * just these interfaces without dragging the whole runtime in.
 */

/**
 * Theme palette used by the shell when it styles its `%c` log
 * output. Every field is a CSS colour string — hex, rgb(),
 * hsl(), CSS variable, anything that `color:` / `background:`
 * accept.
 *
 * Defaults ship a phosphor-on-void palette (lime + amber +
 * magenta + cyan on a near-black background) that reads
 * cleanly in both dark- and light-theme dev tools.
 */
export interface Theme {
	/** Brand primary — headings, banner, command-name accents. */
	primary: string;
	/** Attention colour — secondary callouts, hints. */
	accent: string;
	/** Strong/terminal colour — CTAs, share commands. */
	danger: string;
	/** Secondary info colour — taglines, links, sub-headings. */
	info: string;
	/** Body / general text colour. */
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
 * is optional — pass `{}` (or omit the banner entirely) to
 * suppress the banner without affecting the rest of the shell.
 * The fields render top-to-bottom in this order.
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
