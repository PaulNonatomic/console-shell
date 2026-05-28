import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createShell } from '../src/shell.js';
import type { ShellLogger } from '../src/types.js';

/**
 * Capturing logger — records every `.log(message, ...styles)`
 * call so tests can assert against what would have hit
 * console.log without polluting the test runner's stdout.
 */
function createCapturingLogger(): {
	logger: ShellLogger;
	calls: Array<{ message: string; styles: string[] }>;
} {
	const calls: Array<{ message: string; styles: string[] }> = [];
	const logger: ShellLogger = {
		log: (message: string, ...styles: string[]) => {
			calls.push({ message, styles });
		}
	};
	return { logger, calls };
}

beforeEach(() => {
	// Clean up any namespaces previous tests installed.
	for (const key of ['testbrand', 'noop']) {
		delete (globalThis as Record<string, unknown>)[key];
	}
});

describe('createShell', () => {
	it('installs a frozen api at window[namespace]', () => {
		const { logger } = createCapturingLogger();
		const shell = createShell({ namespace: 'testbrand', logger });
		shell.install();
		const api = (globalThis as Record<string, unknown>).testbrand;
		expect(api).toBeTypeOf('object');
		expect(Object.isFrozen(api)).toBe(true);
	});

	it('exposes user-defined commands on the namespace', () => {
		const { logger } = createCapturingLogger();
		const ran = vi.fn();
		const shell = createShell({
			namespace: 'testbrand',
			logger,
			commands: {
				about: { description: 'who we are', run: ran }
			}
		});
		shell.install();
		const api = (globalThis as Record<string, unknown>).testbrand as {
			about: () => void;
		};
		api.about();
		expect(ran).toHaveBeenCalledOnce();
	});

	it('auto-generates a help command listing every command', () => {
		const { logger, calls } = createCapturingLogger();
		const shell = createShell({
			namespace: 'testbrand',
			logger,
			commands: {
				about: { description: 'who we are', run: () => {} },
				contact: { description: 'say hi', run: () => {} }
			}
		});
		shell.install();
		calls.length = 0; // reset captured installer noise
		const api = (globalThis as Record<string, unknown>).testbrand as {
			help: () => void;
		};
		api.help();
		const flat = calls.map((c) => c.message).join('\n');
		expect(flat).toContain('about');
		expect(flat).toContain('who we are');
		expect(flat).toContain('contact');
		expect(flat).toContain('say hi');
	});

	it('fires onCommand whenever a command is invoked', () => {
		const onCommand = vi.fn();
		const { logger } = createCapturingLogger();
		const shell = createShell({
			namespace: 'testbrand',
			logger,
			onCommand,
			commands: {
				about: { description: 'who we are', run: () => {} }
			}
		});
		shell.install();
		const api = (globalThis as Record<string, unknown>).testbrand as {
			about: () => void;
		};
		api.about();
		expect(onCommand).toHaveBeenCalledWith('about');
	});

	it('prints banner art / wordmark / tagline / hint when configured', () => {
		const { logger, calls } = createCapturingLogger();
		const shell = createShell({
			namespace: 'testbrand',
			logger,
			banner: {
				art: 'XXX',
				wordmark: 'TESTBRAND',
				tagline: 'a tag line',
				hint: 'try testbrand.help()'
			}
		});
		shell.install();
		const flat = calls.map((c) => c.message).join('\n');
		expect(flat).toContain('XXX');
		expect(flat).toContain('TESTBRAND');
		expect(flat).toContain('a tag line');
		expect(flat).toContain('try testbrand.help()');
	});

	it('silently no-ops banner when none configured', () => {
		const { logger, calls } = createCapturingLogger();
		const shell = createShell({ namespace: 'testbrand', logger });
		shell.install();
		// No "TESTBRAND" or styled art — just a trailing blank
		// line at most.
		const flat = calls.map((c) => c.message).join('');
		expect(flat).not.toMatch(/[A-Z]{3,}/);
	});

	it('refuses to register a command after install', () => {
		const { logger } = createCapturingLogger();
		const shell = createShell({ namespace: 'testbrand', logger });
		shell.install();
		shell.registerCommand('late', {
			description: 'too late',
			run: () => {}
		});
		const api = (globalThis as Record<string, unknown>).testbrand as Record<
			string,
			unknown
		>;
		expect(api.late).toBeUndefined();
	});

	it('install is idempotent', () => {
		const { logger, calls } = createCapturingLogger();
		const shell = createShell({
			namespace: 'testbrand',
			logger,
			banner: { wordmark: 'ONCE' }
		});
		shell.install();
		const first = calls.length;
		shell.install();
		expect(calls.length).toBe(first);
	});

	it('attach() forwards to plugin.attachTo()', () => {
		const { logger } = createCapturingLogger();
		const shell = createShell({ namespace: 'testbrand', logger });
		const plugin = {
			attachTo: vi.fn((s) => {
				s.registerCommand('plug', { description: 'plug', run: () => {} });
			})
		};
		shell.attach(plugin);
		shell.install();
		const api = (globalThis as Record<string, unknown>).testbrand as Record<
			string,
			unknown
		>;
		expect(plugin.attachTo).toHaveBeenCalledWith(shell);
		expect(api.plug).toBeTypeOf('function');
	});
});
