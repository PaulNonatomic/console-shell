# console-shell

> Hide a styled CLI inside your site's developer console. Banner, window namespace, themed help, zero deps.

`console-shell` lets you ship a tiny CLI inside your site's browser console — a styled banner, a `window.yourbrand` namespace with custom commands, and an auto-generated colour-coded help screen. Curious devs who open dev tools find it; the rest of the world never sees it.

[![CI](https://github.com/PaulNonatomic/console-shell/actions/workflows/ci.yml/badge.svg)](https://github.com/PaulNonatomic/console-shell/actions/workflows/ci.yml)
[![license: MIT](https://img.shields.io/badge/license-MIT-c7f441.svg)](./LICENSE)

<!-- npm badge will appear here once the package is published. -->
<!-- [![npm](https://img.shields.io/npm/v/console-shell.svg)](https://www.npmjs.com/package/console-shell) -->


---

## Why

You spent months on a site. A handful of visitors will open dev tools. That handful are often the ones you most want to impress — other devs, recruiters, potential collaborators. Reward them with something more than minified JavaScript.

This library extracts the easter-egg pattern Nonatomic ships at [nonatomic.co.uk](https://nonatomic.co.uk):

- A styled ASCII/Unicode banner that fires once per page load
- A `window.nonatomic` namespace with commands like `.about()`, `.contact()`, `.colours()`
- An auto-generated `.help()` listing with per-command colour

Want to layer a branching text adventure on top of the shell? See the companion package [**`console-adventure`**](https://github.com/PaulNonatomic/console-adventure).

---

## Install

```bash
npm install console-shell
# or
pnpm add console-shell
# or
yarn add console-shell
```

Zero runtime dependencies. ESM + CJS + types, ~5 KB gzipped.

---

## Quick start

```ts
import { createShell } from 'console-shell';

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
		},
		site: {
			description: 'open the site',
			color: 'info',
			run: () => window.open('https://example.com', '_blank')
		}
	}
});

shell.install();
```

Open dev tools and you'll see the banner. Type `mybrand.help()` and you'll get a colour-coded list of every command:

```
   mybrand.*  — commands
     .about()      — who we are
     .contact()    — say hi
     .help()       — list available commands
     .site()       — open the site
```

---

## API

### `createShell(config: ShellConfig): Shell`

| Field        | Type                              | Notes                                                              |
| ------------ | --------------------------------- | ------------------------------------------------------------------ |
| `namespace`  | `string`                          | Attached to `window[namespace]` (frozen) on install.               |
| `banner?`    | `Banner`                          | `{ art?, wordmark?, tagline?, hint? }`. Each layer is optional.    |
| `theme?`     | `Partial<Theme>`                  | Shallow-merged over `DEFAULT_THEME`.                               |
| `commands?`  | `Record<string, Command>`         | Each `Command = { description, color?, run }`.                     |
| `onCommand?` | `(name: string) => void`          | Fires on every invocation. Wire it to analytics or leave it unset. |
| `logger?`    | `{ log(msg, ...styles) }`         | Defaults to `console`. Tests pass a capturing stub.                |

The returned `Shell` exposes:

- `install()` — print the banner, freeze the namespace, attach it to `window`.
- `registerCommand(name, command)` — add a command before install.
- `attach(plugin)` — sugar for `plugin.attachTo(shell)`. The `ShellPlugin` interface (`{ attachTo(shell): void }`) is intentionally structural so any third-party module (text adventure, debug REPL, in-page tutorial) can plug in without console-shell knowing about it.
- `theme`, `namespace`, `logger` — resolved values, for plugins to use.

### Theme

`DEFAULT_THEME` ships a phosphor-on-void palette (lime + amber + magenta + cyan on near-black). Override any field:

```ts
createShell({
	namespace: 'mybrand',
	theme: { primary: '#3aa0ff', accent: '#ffd400', danger: '#ff3ad0' }
});
```

Theme colour slots referenced by name: `primary`, `accent`, `danger`, `info`, `text`, `dim`.

### Analytics

The library is analytics-agnostic. Wire `onCommand` into whatever you use:

```ts
createShell({
	namespace: 'mybrand',
	onCommand: (name) => analytics.track('console_command', { name })
});
```

The hook is called raw — no built-in dedupe. If you want once-per-session-per-command semantics (recommended for budget-conscious analytics), wrap it yourself with `sessionStorage`.

---

## Layering an adventure on top

The companion package [`console-adventure`](https://github.com/PaulNonatomic/console-adventure) provides a branching scene-graph text adventure engine that plugs in via the `ShellPlugin` interface:

```ts
import { createShell } from 'console-shell';
import { createAdventure } from 'console-adventure';

const game = createAdventure({ start: 'entrance', scenes: { /* ... */ } });
const shell = createShell({ namespace: 'mybrand' });

shell.attach(game.asShellPlugin());  // adds .play(), .choose(n), .share()
shell.install();
```

You can use either package on its own — `console-shell` for a pure easter egg, `console-adventure` for a game that drives its own UI without dev-console wrapping.

---

## Example

A minimal working example ships in [`examples/minimal/`](./examples/minimal/) — open `index.html` in a browser and pop dev tools to try it.

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

- [`console-adventure`](https://github.com/PaulNonatomic/console-adventure) — branching text adventure engine that plugs into this shell.
- [nonatomic.co.uk](https://nonatomic.co.uk) — open dev tools, type `nonatomic.help()`.
- [paulstamp.com](https://paulstamp.com) — same thing, different brand.
