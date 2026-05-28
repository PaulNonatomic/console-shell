/**
 * `createAdventure()` — branching choice-based text adventure
 * factory. Returns an object whose `attachTo(shell)` registers
 * three commands on the shell:
 *
 *   - `.play()`       — start (or restart) the adventure
 *   - `.choose(n)`    — pick option `n` from the current scene
 *   - `.share()`      — open the share intent (only after
 *                       finishing, only if ShareConfig was set)
 *
 * The state is held inside the closure returned by
 * `createAdventure` — one game-state per adventure instance,
 * so a single page can host multiple independent adventures
 * (each attached to its own shell) without them tangling.
 */
import type {
	AdventureConfig,
	Choice,
	Scene,
	Theme,
	Tier,
	ShellLogger
} from './types.js';
import type { Shell, ShellPlugin } from './shell.js';
import {
	styleSceneHeading,
	styleNarration,
	styleChoice,
	styleResultMarker,
	styleResultText,
	styleResultRule,
	styleFinish,
	styleFor,
	styleBoldFor
} from './style.js';
import { blank, logLine } from './log.js';
import { buildXIntent } from './share.js';

export interface Adventure extends ShellPlugin {
	/** Maximum achievable score across all branches. */
	readonly maxScore: number;
	/**
	 * Resolve a tier label for a given score. Useful for
	 * landing pages that want to compute the tier without
	 * re-running the game.
	 */
	tierFor(score: number): string;
}

interface GameState {
	sceneId: string;
	score: number;
	finished: boolean;
}

export function createAdventure(config: AdventureConfig): Adventure {
	if (!config.scenes[config.start]) {
		throw new Error(
			`[console-quest] start scene "${config.start}" is not in the scenes map.`
		);
	}

	const maxScore = computeMaxScore(config);

	// Sort tiers high-to-low so the first match wins.
	const sortedTiers: Tier[] = [...(config.tiers ?? [])].sort(
		(a, b) => b.minScore - a.minScore
	);

	function tierFor(score: number): string {
		for (const tier of sortedTiers) {
			if (score >= tier.minScore) return tier.label;
		}
		// No tier matched — return a generic label so the caller
		// always gets a string back.
		return 'Player';
	}

	function tierColorFor(score: number): import('./types.js').ThemeColor {
		for (const tier of sortedTiers) {
			if (score >= tier.minScore) return tier.color ?? 'primary';
		}
		return 'primary';
	}

	let state: GameState | null = null;

	function attachTo(shell: Shell): void {
		const theme = shell.theme;
		const logger = shell.logger;

		shell.registerCommand('play', {
			description: `start the adventure (${maxScore} points to forge)`,
			color: 'primary',
			run: () => start(logger, theme)
		});
		shell.registerCommand('choose', {
			description: 'pick a numbered option mid-game',
			color: 'dim',
			run: (...args: unknown[]) => {
				const n = Number(args[0]);
				if (!Number.isFinite(n)) {
					logLine(
						logger,
						'`choose(n)` needs a number, e.g. choose(1).',
						styleFor(theme, 'dim')
					);
					return;
				}
				chooseOption(n, logger, theme, () => {
					// onFinish — fire user's onComplete hook with
					// the final score + resolved tier.
					if (!state?.finished) return;
					const tier = tierFor(state.score);
					config.onComplete?.({ score: state.score, max: maxScore, tier });
				});
			}
		});

		if (config.share) {
			shell.registerCommand('share', {
				description: 'share your finished run',
				color: 'danger',
				run: () => share(logger, theme)
			});
		}
	}

	function start(logger: ShellLogger, theme: Theme): void {
		state = { sceneId: config.start, score: 0, finished: false };
		config.onStart?.();

		// Optional intro printed once at the top of each run.
		if (config.intro) {
			blank(logger);
			for (const line of config.intro) {
				logLine(logger, line, styleFor(theme, 'dim'));
			}
			blank(logger);
		}

		printScene(config.start, logger, theme);
	}

	function chooseOption(
		n: number,
		logger: ShellLogger,
		theme: Theme,
		onFinish: () => void
	): void {
		if (!state) {
			logLine(
				logger,
				'No game in progress. Boot it with `play()`.',
				styleFor(theme, 'dim')
			);
			return;
		}
		if (state.finished) {
			logLine(
				logger,
				'Game already finished. Restart with `play()`.',
				styleFor(theme, 'dim')
			);
			return;
		}

		const scene = config.scenes[state.sceneId];
		const choice: Choice | undefined = scene?.choices[n - 1];
		if (!scene || !choice) {
			logLine(
				logger,
				`Choice ${n} not available — pick 1–${scene?.choices.length ?? 0}.`,
				styleFor(theme, 'dim')
			);
			return;
		}

		state.score += choice.points ?? 0;
		if (choice.flavour) {
			printResultCallout(choice.flavour, logger, theme);
		}

		if (choice.next === null) {
			finish(logger, theme);
			onFinish();
		} else {
			state.sceneId = choice.next;
			printScene(state.sceneId, logger, theme);
		}
	}

	function printScene(sceneId: string, logger: ShellLogger, theme: Theme): void {
		const scene: Scene | undefined = config.scenes[sceneId];
		if (!scene) return;

		logger.log(`%c   ${scene.heading}`, styleSceneHeading(theme));
		blank(logger);
		for (const line of scene.narration) {
			logger.log(`%c   ${line}`, styleNarration(theme));
		}
		blank(logger);
		scene.choices.forEach((choice, i) => {
			logger.log(`%c     ${i + 1}) ${choice.label}`, styleChoice(theme));
		});
		blank(logger);
		logLine(
			logger,
			`> choose(1..${scene.choices.length})`,
			styleFor(theme, 'dim')
		);
		blank(logger);
	}

	function printResultCallout(
		flavour: string,
		logger: ShellLogger,
		theme: Theme
	): void {
		const rule = '──────────────────────────────────────────';
		blank(logger);
		logger.log(`%c   ${rule}`, styleResultRule(theme));
		logger.log(
			`%c   ▶  %c${flavour}`,
			styleResultMarker(theme),
			styleResultText(theme)
		);
		logger.log(`%c   ${rule}`, styleResultRule(theme));
		blank(logger);
	}

	function finish(logger: ShellLogger, theme: Theme): void {
		if (!state) return;
		state.finished = true;
		const score = state.score;
		const tier = tierFor(score);
		const tierColor = tierColorFor(score);

		const rule = '════════════════════════════════════════';
		logger.log(`%c   ${rule}`, styleBoldFor(theme, 'primary'));
		logger.log(
			`%c   FORGED. Score: ${score} / ${maxScore}`,
			styleFinish(theme)
		);
		logger.log(`%c   Rank: ${tier}`, styleBoldFor(theme, tierColor));
		logger.log(`%c   ${rule}`, styleBoldFor(theme, 'primary'));
		blank(logger);

		if (config.share) {
			logLine(logger, 'Share your run:', styleFor(theme, 'dim'));
			logLine(logger, '> share()', styleBoldFor(theme, 'danger'));
			blank(logger);
		}
		logLine(logger, 'Or play again:', styleFor(theme, 'dim'));
		logLine(logger, '> play()', styleBoldFor(theme, 'primary'));
		blank(logger);
	}

	function share(logger: ShellLogger, theme: Theme): void {
		if (!config.share) return;
		if (!state?.finished) {
			logLine(
				logger,
				'Finish the game first — `play()`.',
				styleFor(theme, 'dim')
			);
			return;
		}
		const tier = tierFor(state.score);
		const text = config.share.text({ score: state.score, max: maxScore, tier });
		const url = config.share.url({ score: state.score, tier });
		const intent = (config.share.intent ?? buildXIntent)(text, url);

		config.onShare?.({ score: state.score, max: maxScore, tier });

		logLine(logger, 'Opening share intent…', styleFor(theme, 'dim'));
		if (typeof window !== 'undefined') {
			window.open(intent, '_blank', 'noopener,noreferrer');
		}
	}

	return {
		maxScore,
		tierFor,
		attachTo
	};
}

/**
 * Depth-first walk of the scene graph, summing the best
 * point-take from each node. Memoised, so reconverging
 * branches (e.g. arcade and workshop both leading to forge)
 * don't double-count.
 */
function computeMaxScore(config: AdventureConfig): number {
	const cache = new Map<string, number>();
	function bestFrom(sceneId: string): number {
		const cached = cache.get(sceneId);
		if (cached !== undefined) return cached;
		const scene = config.scenes[sceneId];
		if (!scene) {
			cache.set(sceneId, 0);
			return 0;
		}
		const best = Math.max(
			...scene.choices.map(
				(c) => (c.points ?? 0) + (c.next ? bestFrom(c.next) : 0)
			)
		);
		cache.set(sceneId, best);
		return best;
	}
	return bestFrom(config.start);
}
