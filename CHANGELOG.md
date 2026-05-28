# Changelog

All notable changes to this project will be documented in this file. The format
is loosely based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/).

## [0.1.0] — Unreleased

Initial release.

### Added

- `createShell(config)` — window-namespaced developer-console CLI surface with
  banner, themed help screen, and pluggable analytics hook.
- `createAdventure(config)` — branching scene-graph text adventure that prints
  to `console.log`, driven by `.choose(n)` calls. Supports optional scoring,
  tier resolution, and a share intent that opens after the game finishes.
- `DEFAULT_THEME` + `resolveTheme(partial)` — phosphor-on-void palette with
  shallow-merge override.
- Share-intent builders for X (Twitter), Mastodon, and Bluesky. Consumers can
  supply their own for other platforms.
- Examples: a minimal shell and a full Foundry-style adventure.
- vitest test suite covering theme resolution, shell install/attach behaviour,
  full playthroughs, branching scoring (DFS), and share intent generation.
