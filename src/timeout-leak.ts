import { AsyncLocalStorage } from 'node:async_hooks';
import { createRequire } from 'node:module';

type TimeoutStore = { extend?: unknown } | undefined;

// @apify/timeout keeps an `extend` closure in its store, and the closure holds the whole request context.
// Timers started during a request inherit the store, so every page (HTML and DOMs) stays in memory until they end.
export const fixTimeoutStoreLeak = () => {
    // Load the CommonJS copy crawlee uses. The ESM build has a store of its own.
    const require = createRequire(import.meta.url);
    const { storage } = createRequire(require.resolve('@crawlee/basic'))('@apify/timeout') as {
        storage: AsyncLocalStorage<TimeoutStore>;
    };

    const run = storage.run.bind(storage);
    // crawlee never calls `extendTimeout`, so nothing needs `extend`.
    storage.run = ((store: TimeoutStore, callback: (...args: unknown[]) => unknown, ...args: unknown[]) => {
        delete store?.extend;
        return run(store, callback, ...args);
    }) as typeof storage.run;
};
