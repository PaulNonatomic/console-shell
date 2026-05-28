/**
 * `createShell()` — the developer-console CLI factory.
 *
 * Given a ShellConfig, returns a Shell object whose `install()`
 * method does three things:
 *   1. Prints the banner to the console
 *   2. Builds an api object with the user's commands plus an
 *      auto-generated `.help()`
 *   3. Attaches that object at `window[namespace]` (frozen, so
 *      the user can't accidentally clobber it from the console)
 *
 * The Shell also exposes `registerCommand(name, command)` and
 * `attach({...})` for adventures and other plugins to add
 * commands before `install()` is called. After install, the
 * frozen object can't be mutated — call `attach` first.
 */
import type {
	ShellConfig,
	Theme,
	Command,
	Logger,
	ThemeColor
} from './types.js';
import { resolveTheme } from './theme.js';
import { printBanner } from './banner.js';
import { realLogger, blank, logTwo } from './log.js';
import { styleBoldFor, styleFor } from './style.js';

export interface Shell {
	/** Resolved namespace string. */
	readonly namespace: string;
	/** Resolved (merged-with-defaults) theme. */
	readonly theme: Theme;
	/** Underlying logger (default: real console). */
	readonly logger: Logger;
	/**
	 * Register a command. Must be called before `install()`;
	 * registering after install logs a warning and is a no-op
	 * (the namespace is frozen).
	 */
	registerCommand(name: string, command: Command): void;
	/**
	 * Attach a plugin (e.g. an adventure) that registers one or
	 * more commands. The plugin receives the shell so it can
	 * call `registerCommand` and read the theme. Sugar over
	 * `plugin.attachTo(shell)`.
	 */
	attach(plugin: ShellPlugin): void;
	/** Build the api object and attach it to window[namespace]. */
	install(): void;
	/** True once install() has been called. */
	isInstalled(): boolean;
	/**
	 * Fire the user's onCommand hook. Exposed so plugins
	 * (specifically adventures) can route their own command
	 * usage through the shared analytics callback.
	 */
	reportCommand(name: string): void;
}

/** Anything that can register itself onto a Shell. */
export interface ShellPlugin {
	attachTo(shell: Shell): void;
}

interface InternalCommand extends Command {
	color: ThemeColor;
}

export function createShell(config: ShellConfig): Shell {
	const theme = resolveTheme(config.theme);
	const logger = config.logger ?? realLogger;
	const commands: Record<string, InternalCommand> = {};

	// Seed user-provided commands.
	if (config.commands) {
		for (const [name, cmd] of Object.entries(config.commands)) {
			commands[name] = { ...cmd, color: cmd.color ?? 'primary' };
		}
	}

	let installed = false;

	function registerCommand(name: string, command: Command): void {
		if (installed) {
			logger.log(
				`%c   [console-quest] command "${name}" registered after install — ignored.`,
				styleFor(theme, 'dim')
			);
			return;
		}
		commands[name] = { ...command, color: command.color ?? 'primary' };
	}

	function buildHelp(namespace: string): Command {
		return {
			description: 'list available commands',
			color: 'primary',
			run: () => {
				logTwo(
					logger,
					`${namespace}.*`,
					styleBoldFor(theme, 'primary'),
					'  — commands',
					styleFor(theme, 'dim')
				);
				// Sorted alphabetically so the output is stable
				// across runs and easy to scan.
				const names = Object.keys(commands).sort();
				for (const name of names) {
					const cmd = commands[name]!;
					logTwo(
						logger,
						`  .${name}()`.padEnd(20, ' '),
						styleBoldFor(theme, cmd.color),
						` — ${cmd.description}`,
						styleFor(theme, 'dim')
					);
				}
			}
		};
	}

	function install(): void {
		if (installed) return;
		installed = true;

		printBanner(config.banner, theme, logger);

		// Inject the auto-help command. Registered last so it
		// can list everything else.
		commands.help = { ...buildHelp(config.namespace), color: 'primary' };

		const api: Record<string, (...args: unknown[]) => void> = {};
		for (const [name, cmd] of Object.entries(commands)) {
			api[name] = (...args: unknown[]) => {
				config.onCommand?.(name);
				cmd.run(...args);
			};
		}
		// Freeze so the curious dev can't accidentally clobber
		// commands by reassigning into the namespace.
		(globalThis as Record<string, unknown>)[config.namespace] = Object.freeze(api);
		blank(logger);
	}

	function reportCommand(name: string): void {
		config.onCommand?.(name);
	}

	return {
		namespace: config.namespace,
		theme,
		logger,
		registerCommand,
		attach(plugin) {
			plugin.attachTo(this);
		},
		install,
		isInstalled: () => installed,
		reportCommand
	};
}
