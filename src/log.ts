/**
 * Logger helpers — thin wrappers around the consumer-supplied
 * (or default) `Logger`. Centralising the call sites means
 * tests can swap in a capturing logger and assert against
 * exactly what would have hit `console.log`.
 */
import type { Logger } from './types.js';

/** Default logger — uses the real `console`. */
export const realLogger: Logger = {
	log: (message: string, ...styles: string[]) => {
		// eslint-disable-next-line no-console
		console.log(message, ...styles);
	}
};

/**
 * Log a single styled line, prefixed with the standard 3-space
 * indent the library uses for all output. The leading `%c`
 * applies the style to the whole indented line.
 */
export function logLine(logger: Logger, text: string, style: string): void {
	logger.log(`%c   ${text}`, style);
}

/**
 * Log a blank line. Wrapped in a helper so the intent is
 * obvious at the call site (`blank(logger)` vs the bare
 * `logger.log('')`).
 */
export function blank(logger: Logger): void {
	logger.log('');
}

/**
 * Log a two-segment line where the first part and second part
 * have different styles — used heavily by the help screen
 * (command name in colour, description in dim) and the result
 * callout (marker in accent, body in text).
 */
export function logTwo(
	logger: Logger,
	leftText: string,
	leftStyle: string,
	rightText: string,
	rightStyle: string
): void {
	logger.log(`%c   ${leftText}%c${rightText}`, leftStyle, rightStyle);
}
