import tseslint from 'typescript-eslint';

// Flat config: only lint TypeScript sources and ignore build and vendor outputs.
export default [
    { ignores: ['**/node_modules/**', '**/dist/**', '**/coverage/**', 'scripts/**', '**/*.js'] },
    // typescript-eslint recommended already scopes to TS via its own file matchers
    ...tseslint.configs.recommended,
];
