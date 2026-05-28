# console-quest

> Brand-styled developer-console shells and branching text adventures for the web. Hide a CLI in your dev tools.

`console-quest` lets you ship a tiny CLI inside your site's browser console — a banner, a `window.yourbrand` namespace with custom commands, and (optionally) a branching choice-based text adventure that plays out in `console.log`. Curious devs who open dev tools find the banner; the rest of the world never sees it.

[![CI](https://github.com/PaulNonatomic/console-quest/actions/workflows/ci.yml/badge.svg)](https://github.com/PaulNonatomic/console-quest/actions/workflows/ci.yml)
[![npm](https://img.shields.io/npm/v/console-quest.svg)](https://www.npmjs.com/package/console-quest)
[![license](https://img.shields.io/npm/l/console-quest.svg)](./LICENSE)

---

## Why

You spent months on a site. A handful of visitors will open dev tools. That handful are usually the ones you most want to impress — other devs, recruiters, potential collaborators. Reward them with something more than minified JavaScript.

This library extracts the pattern Nonatomic ships at [nonatomic.co.uk](https://nonatomic.co.uk):

- A styled ASCII/Unicode banner that fires once per page load
- A `window.nonatomic` namespace with commands like `.about()`, `.contact()`, `.colours()`
- A branching text adventure (`The Foundry`) playable via `.play()` + `.choose(n)`, with score tracking, tier titles, and an X-intent share funnel

The whole thing is one small dependency-free TypeScript library. Zero runtime deps, ESM + CJS + types, ~5 KB gzipped.

---

## Install

```bash
npm install console-quest
# or
pnpm add console-quest
# or
yarn add console-quest
```

---

## Quick start — just a shell

```ts
import { createShell } from 'console-quest';

const shell = createShell({
	namespace: 'mybrand', // → window.mybrand
	banner: {
		wordmark: 'M Y B R A N D',
		tagline: 'We make things.',
		hint: 'try mybrand.help()'
	},
	commands: {
		about: {
			description: 'who we are',
			color: 'primary',
			run: () => console.log('We make things, since 2024.')
		},
		contact: {
			description: 'say hi',
			color: 'danger',
			run: () => window.open('mailto:hi@example.com')
		}
	}
});

shell.install();
```

Open dev tools and you'll see the banner. Type `mybrand.help()` and you'll get a colour-coded list of every command.

---

## Quick start — shell + adventure

```ts
import { createShell, createAdventure } from 'console-quest';

const game = createAdventure({
	start: 'entrance',
	scenes: {
		entrance: {
			heading: 'You stand at the edge of the foundry.',
			narration: ['Two doors. Which one?'],
			choices: [
				{ label: 'Take the lit door', points: 2, next: 'lit' },
				{ label: 'Take the dark door', points: 1, next: 'dark' }
			]
		},
		lit: {
			heading: 'A warm hall.',
			narration: ['It smells like solder.'],
			choices: [{ label: 'Continue', points: 2, flavour: 'You find the forge.', next: null }]
		},
		dark: {
			heading: 'A cold hall.',
			narration: ['You hear humming.'],
			choices: [{ label: 'Continue', points: 1, flavour: 'You find the forge.', next: null }]
		}
	},
	tiers: [
		{ minScore: 4, label: 'Master Forge', color: 'primary' },
		{ minScore: 0, label: 'Apprentice', color: 'dim' }
	],
	share: {
		text: ({ score, tier }) => `Forged ${tier} (${score}/4) at example.com.`,
		url: ({ score }) => `https://example.com/foundry?s=${score}`
	},
	onComplete: ({ score, tier }) => console.log(`finished as ${tier} with ${score}`)
});

const shell = createShell({
	namespace: 'mybrand',
	banner: { wordmark: 'M Y B R A N D', hint: 'try mybrand.play()' }
});

shell.attach(game);
shell.install();
```

Now the namespace gets `.play()`, `.choose(n)`, and `.share()` on top of your custom commands. Fire `mybrand.play()` in the console and it begins.

---

## API

### `createShell(config: ShellConfig): Shell`

| Field        | Type                                    | Notes                                                              |
| ------------ | --------------------------------------- | ------------------------------------------------------------------ |
| `namespace`  | `string`                                | Attached to `window[namespace]` (frozen) on install.               |
| `banner?`    | `Banner`                                | `{ art?, wordmark?, tagline?, hint? }`. Each layer is optional.    |
| `theme?`     | `Partial<Theme>`                        | Shallow-merged over `DEFAULT_THEME`.                               |
| `commands?`  | `Record<string, Command>`               | Each `Command = { description, color?, run }`.                     |
| `onCommand?` | `(name: string) => void`                | Fires on every invocation. Wire it to analytics or leave it unset. |
| `logger?`    | `{ log(msg, ...styles) }`               | Defaults to `console`. Tests pass a capturing stub.                |

The returned `Shell` exposes:

- `install()` — print the banner, freeze the namespace, attach it to `window`.
- `registerCommand(name, command)` — add a command before install.
- `attach(plugin)` — sugar for `plugin.attachTo(shell)`. Adventures are plugins.
- `theme`, `namespace`, `logger` — resolved values for plugins to use.

### `createAdventure(config: AdventureConfig): Adventure`

| Field          | Type                                   | Notes                                                                       |
| -------------- | -------------------------------------- | --------------------------------------------------------------------------- |
| `start`        | `string`                               | Scene id where the game begins.                                             |
| `scenes`       | `Record<string, Scene>`                | Each `Scene = { heading, narration[], choices[] }`.                         |
| `tiers?`       | `Tier[]`                               | `{ minScore, label, color? }`. Resolver picks the highest qualifying tier.  |
| `share?`       | `ShareConfig`                          | Set this to expose `.share()` once the game finishes.                       |
| `intro?`       | `string[]`                             | Lines printed once at the top of every `play()`.                            |
| `onStart?`     | `() => void`                           | Fires every `play()`. No dedupe — that's your job if you want it.           |
| `onComplete?`  | `(args) => void`                       | Fires when a `null`-`next` choice is selected. Includes `{score,max,tier}`. |
| `onShare?`     | `(args) => void`                       | Fires when `share()` is invoked post-finish.                                |

Each `Choice` declares its own `next: string | null` — so the script branches naturally. Reconverging paths (two scenes both pointing to a third) are handled by the DFS-based `maxScore` resolver so scoring stays honest.

### Theme

`DEFAULT_THEME` is the phosphor-on-void palette used throughout Nonatomic. Override any field:

```ts
createShell({
	namespace: 'mybrand',
	theme: { primary: '#3aa0ff', accent: '#ffd400', danger: '#ff3ad0' }
});
```

Theme colour slots referenced by name: `primary`, `accent`, `danger`, `info`, `text`, `dim`.

### Share intents

The default `share()` opens `https://twitter.com/intent/tweet`. Override `share.intent` to target a different platform — `buildMastodonIntent` and `buildBlueskyIntent` are provided:

```ts
import { buildMastodonIntent } from 'console-quest';

createAdventure({
	// ...
	share: {
		text: (a) => `Forged ${a.tier}.`,
		url: (a) => `https://example.com/${a.score}`,
		intent: (text, url) => buildMastodonIntent(text, url, 'mastodon.social')
	}
});
```

---

## Analytics

The library is analytics-agnostic. Wire `onCommand` (shell), `onStart` / `onComplete` / `onShare` (adventure) into whatever you use:

```ts
createShell({
	namespace: 'mybrand',
	onCommand: (name) => analytics.track('console_command', { name })
});

createAdventure({
	// ...
	onComplete: ({ score, tier }) =>
		analytics.track('console_game_completed', { score, tier })
});
```

These hooks are called raw — no built-in dedupe. If you want once-per-session-per-event semantics (recommended for budget-conscious analytics), wrap them yourself with `sessionStorage`.

---

## Examples

Two complete examples ship in [`/examples`](./examples):

- [`minimal/`](./examples/minimal/) — a shell with two commands, no game.
- [`foundry/`](./examples/foundry/) — full Nonatomic-style adventure with branching and share.

Open `examples/foundry/index.html` in a browser and pop dev tools — `foundry.play()` is waiting.

---

## Dev

```bash
npm install
npm test           # vitest
npm run typecheck  # tsc --noEmit
npm run build      # tsup → dist/
```

Tests run in jsdom. The library is browser-only at runtime (it touches `window`) but the test harness stubs the logger so tests don't pollute stdout.

---

## License

MIT © Paul Stamp / [Nonatomic Digital Foundry](https://nonatomic.co.uk).

---

## See also

- [nonatomic.co.uk](https://nonatomic.co.uk) — open dev tools, type `nonatomic.help()`.
- [paulstamp.com](https://paulstamp.com) — same thing, different brand.
