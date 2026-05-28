import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createAdventure } from '../src/adventure.js';
import { createShell } from '../src/shell.js';
import type { AdventureConfig, ShellLogger } from '../src/types.js';

function makeLogger(): { logger: ShellLogger; messages: string[] } {
	const messages: string[] = [];
	return {
		logger: { log: (m: string) => messages.push(m) },
		messages
	};
}

/**
 * A small branching script reused across the tests below.
 * Mirrors the shape of the real Foundry game: entrance with
 * two branches that reconverge at a middle scene, then a
 * terminal scene. Max score = 2 + 3 + 3 = 8.
 */
const branchingScript: AdventureConfig = {
	start: 'entrance',
	scenes: {
		entrance: {
			heading: 'entrance',
			narration: ['stand at the door.'],
			choices: [
				{ label: 'go left', points: 2, next: 'left' },
				{ label: 'go right', points: 1, next: 'right' }
			]
		},
		left: {
			heading: 'left room',
			narration: ['lefty.'],
			choices: [{ label: 'forward', points: 3, next: 'end' }]
		},
		right: {
			heading: 'right room',
			narration: ['righty.'],
			choices: [{ label: 'forward', points: 3, next: 'end' }]
		},
		end: {
			heading: 'the end',
			narration: ['done.'],
			choices: [{ label: 'sign off', points: 3, next: null }]
		}
	},
	tiers: [
		{ minScore: 0, label: 'Newbie' },
		{ minScore: 5, label: 'Solid' },
		{ minScore: 8, label: 'Legend' }
	]
};

beforeEach(() => {
	for (const key of ['quest', 'tinybrand']) {
		delete (globalThis as Record<string, unknown>)[key];
	}
});

describe('createAdventure / scoring', () => {
	it('computes maxScore via DFS — branches do not double-count', () => {
		const a = createAdventure(branchingScript);
		// Best path: entrance (2) → left (3) → end (3) = 8.
		expect(a.maxScore).toBe(8);
	});

	it('resolves tiers by highest qualifying minScore', () => {
		const a = createAdventure(branchingScript);
		expect(a.tierFor(0)).toBe('Newbie');
		expect(a.tierFor(4)).toBe('Newbie');
		expect(a.tierFor(5)).toBe('Solid');
		expect(a.tierFor(7)).toBe('Solid');
		expect(a.tierFor(8)).toBe('Legend');
		expect(a.tierFor(100)).toBe('Legend');
	});

	it('falls back to "Player" when no tier table is supplied', () => {
		const a = createAdventure({ ...branchingScript, tiers: undefined });
		expect(a.tierFor(0)).toBe('Player');
	});

	it('throws on a missing start scene', () => {
		expect(() =>
			createAdventure({ ...branchingScript, start: 'nowhere' })
		).toThrow(/start scene/);
	});
});

describe('createAdventure / attachment', () => {
	it('registers play / choose on the shell', () => {
		const { logger } = makeLogger();
		const shell = createShell({ namespace: 'quest', logger });
		const a = createAdventure(branchingScript);
		shell.attach(a);
		shell.install();
		const api = (globalThis as Record<string, unknown>).quest as Record<
			string,
			unknown
		>;
		expect(api.play).toBeTypeOf('function');
		expect(api.choose).toBeTypeOf('function');
		// No share config → no share command.
		expect(api.share).toBeUndefined();
	});

	it('registers share when ShareConfig is supplied', () => {
		const { logger } = makeLogger();
		const shell = createShell({ namespace: 'quest', logger });
		const a = createAdventure({
			...branchingScript,
			share: {
				text: ({ score, tier }) => `Got ${tier} (${score})`,
				url: ({ score }) => `https://example.com/${score}`
			}
		});
		shell.attach(a);
		shell.install();
		const api = (globalThis as Record<string, unknown>).quest as Record<
			string,
			unknown
		>;
		expect(api.share).toBeTypeOf('function');
	});
});

describe('createAdventure / playthrough', () => {
	it('drives a full left-branch playthrough end-to-end', () => {
		const { logger, messages } = makeLogger();
		const onStart = vi.fn();
		const onComplete = vi.fn();
		const shell = createShell({ namespace: 'quest', logger });
		const a = createAdventure({
			...branchingScript,
			onStart,
			onComplete
		});
		shell.attach(a);
		shell.install();
		const api = (globalThis as Record<string, unknown>).quest as {
			play: () => void;
			choose: (n: number) => void;
		};
		api.play();
		expect(onStart).toHaveBeenCalledOnce();
		expect(messages.some((m) => m.includes('entrance'))).toBe(true);

		api.choose(1); // go left (2 pts), → left
		expect(messages.some((m) => m.includes('left room'))).toBe(true);

		api.choose(1); // forward (3 pts), → end
		expect(messages.some((m) => m.includes('the end'))).toBe(true);

		api.choose(1); // sign off (3 pts), → null → finish
		expect(onComplete).toHaveBeenCalledOnce();
		expect(onComplete).toHaveBeenCalledWith({
			score: 8,
			max: 8,
			tier: 'Legend'
		});
	});

	it('respects branching — going right uses a different scene', () => {
		const { logger, messages } = makeLogger();
		const shell = createShell({ namespace: 'quest', logger });
		const a = createAdventure(branchingScript);
		shell.attach(a);
		shell.install();
		const api = (globalThis as Record<string, unknown>).quest as {
			play: () => void;
			choose: (n: number) => void;
		};
		api.play();
		api.choose(2); // go right
		expect(messages.some((m) => m.includes('right room'))).toBe(true);
		expect(messages.some((m) => m.includes('left room'))).toBe(false);
	});

	it('rejects out-of-range choices with a hint', () => {
		const { logger, messages } = makeLogger();
		const shell = createShell({ namespace: 'quest', logger });
		shell.attach(createAdventure(branchingScript));
		shell.install();
		const api = (globalThis as Record<string, unknown>).quest as {
			play: () => void;
			choose: (n: number) => void;
		};
		api.play();
		api.choose(99);
		expect(messages.some((m) => m.includes('not available'))).toBe(true);
	});

	it('warns when choose() is called before play()', () => {
		const { logger, messages } = makeLogger();
		const shell = createShell({ namespace: 'quest', logger });
		shell.attach(createAdventure(branchingScript));
		shell.install();
		const api = (globalThis as Record<string, unknown>).quest as {
			choose: (n: number) => void;
		};
		api.choose(1);
		expect(messages.some((m) => m.includes('No game in progress'))).toBe(true);
	});

	it('warns when choose() is called after finishing', () => {
		const { logger, messages } = makeLogger();
		const shell = createShell({ namespace: 'quest', logger });
		shell.attach(createAdventure(branchingScript));
		shell.install();
		const api = (globalThis as Record<string, unknown>).quest as {
			play: () => void;
			choose: (n: number) => void;
		};
		api.play();
		api.choose(1);
		api.choose(1);
		api.choose(1); // → end → null → finish
		api.choose(1); // post-finish
		expect(messages.some((m) => m.includes('already finished'))).toBe(true);
	});
});

describe('createAdventure / share', () => {
	it('opens the share intent only after the game finishes', () => {
		const { logger } = makeLogger();
		const openSpy = vi.spyOn(window, 'open').mockReturnValue(null);
		const onShare = vi.fn();
		const shell = createShell({ namespace: 'quest', logger });
		const a = createAdventure({
			...branchingScript,
			onShare,
			share: {
				text: ({ score, tier }) => `Score ${score} as ${tier}`,
				url: ({ score }) => `https://demo.test/${score}`
			}
		});
		shell.attach(a);
		shell.install();
		const api = (globalThis as Record<string, unknown>).quest as {
			play: () => void;
			choose: (n: number) => void;
			share: () => void;
		};

		// Pre-finish share: should NOT open or fire onShare.
		api.share();
		expect(openSpy).not.toHaveBeenCalled();
		expect(onShare).not.toHaveBeenCalled();

		api.play();
		api.choose(1);
		api.choose(1);
		api.choose(1);

		// Post-finish share: should open + fire onShare.
		api.share();
		expect(openSpy).toHaveBeenCalledOnce();
		expect(onShare).toHaveBeenCalledWith({
			score: 8,
			max: 8,
			tier: 'Legend'
		});

		// The URL passed to window.open should be the Twitter
		// intent URL containing the encoded text + landing url.
		const intent = openSpy.mock.calls[0]![0] as string;
		expect(intent).toMatch(/^https:\/\/twitter\.com\/intent\/tweet/);
		expect(intent).toContain(encodeURIComponent('Score 8 as Legend'));
		expect(intent).toContain(encodeURIComponent('https://demo.test/8'));

		openSpy.mockRestore();
	});
});
