/**
 * Banner renderer. Prints the four optional banner fields
 * (art / wordmark / tagline / hint) in order, each in its own
 * themed style. Skipping any of them just suppresses that
 * layer — `printBanner({}, theme, logger)` prints nothing but
 * doesn't error.
 */
import type { Banner, Theme, ShellLogger } from './types.js';
import {
	styleBanner,
	styleWordmark,
	styleFor,
	styleBoldFor
} from './style.js';
import { blank } from './log.js';

export function printBanner(
	banner: Banner | undefined,
	theme: Theme,
	logger: ShellLogger
): void {
	if (!banner) return;

	if (banner.art) {
		// The art is logged as a single styled multi-line string.
		// Spaces remain transparent (no `background:` set in
		// styleBanner) so the silhouette adapts to dark- and
		// light-theme dev tools without leaking dark stripes.
		logger.log(`%c${banner.art}`, styleBanner(theme));
		blank(logger);
	}

	if (banner.wordmark) {
		logger.log(`%c   ${banner.wordmark}`, styleWordmark(theme));
	}

	if (banner.tagline) {
		logger.log(`%c   ${banner.tagline}`, styleFor(theme, 'info'));
	}

	if (banner.wordmark || banner.tagline) {
		blank(logger);
	}

	if (banner.hint) {
		logger.log(`%c   ${banner.hint}`, styleFor(theme, 'dim'));
		// CTA line — render the hint's "try X.help()" call-out in
		// bold accent. If the hint already includes that, we just
		// leave it as-is; the caller controls the wording.
	}

	if (banner.hint) {
		blank(logger);
	}
}

/**
 * Convenience banner part: print a single emphasised CTA line,
 * e.g. `> mybrand.help()`. Exported so an adventure can call
 * it from inside its intro without re-implementing the style.
 */
export function printCta(
	logger: ShellLogger,
	theme: Theme,
	text: string
): void {
	logger.log(`%c     ${text}`, styleBoldFor(theme, 'danger'));
}
