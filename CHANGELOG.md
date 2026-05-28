# Changelog

All notable changes to this project will be documented in this file. The format
is loosely based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/).

## [0.1.0] — Unreleased

Initial release.

### Added

- `createShell(config)` — window-namespaced developer-console CLI surface
  with banner, themed help screen, structural `ShellPlugin` extension point,
  and pluggable analytics hook. Freezes the namespace after install so the
  curious dev can't accidentally clobber commands.
- `DEFAULT_THEME` + `resolveTheme(partial)` — phosphor-on-void palette with
  shallow-merge override.
- Type exports for `Theme`, `Banner`, `Command`, `ShellConfig`, `ShellLogger`,
  `Shell`, `ShellPlugin`.
- Example: a minimal shell with two custom commands.
- vitest test suite covering theme resolution, shell install/attach behaviour
  (idempotency, frozen namespace, banner-or-not, plugin extension).

### Notes

This package began life as `console-quest`, which combined a console shell
with a branching text-adventure engine. The two halves were split in this
release so each can stand on its own:

- `console-shell` (this package) — standalone CLI shell.
- [`console-adventure`](https://github.com/PaulNonatomic/console-adventure) —
  branching scene-graph text adventure that optionally plugs into the shell.

The full git history of the shell code is preserved here; `console-quest` was
renamed in place.
