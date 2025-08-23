What does Object.freeze({}) do?

It makes an object immutable at runtime.

It prevents adding, removing, or changing properties and disallows extension (like preventExtensions + sets all existing data properties to writable: false and configurable: false).
It’s shallow: nested objects aren’t frozen.
It returns the same object reference; in strict mode, illegal writes throw TypeError, otherwise they’re no-ops.
For Object.freeze({}), it produces a non-extensible, immutable empty object.
In this repo, it’s used in jsonrpc.ts to keep JsonRpcErrorCodes from being mutated.
Note: TypeScript’s “as const” is compile-time only; Object.freeze is runtime.
