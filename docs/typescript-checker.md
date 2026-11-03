---
title: TypeScript Checker
custom_edit_url: https://github.com/stryker-mutator/stryker-js/edit/master/docs/typescript-checker.md
---

A TypeScript type checker plugin for Stryker, the ~~JavaScript~~ _TypeScript_ Mutation testing framework.
This plugin enables type checking on mutants, so you won't have to waste time on mutants which result in a type error.

## Features

👽 Type check each mutant. Invalid mutants will be marked as `CompileError` in your Stryker report.<br />
🧒 Easy to setup, only your `tsconfig.json` file is needed.<br />
🔢 Type check is done in-memory, no side effects on disk.<br />
🎁 Support for both single typescript projects as well as projects with project references (`--build` mode).

## Install

First, install Stryker itself (you can follow the [getting started](./getting-started.md))

Next, install this package:

```bash
npm install --save-dev @stryker-mutator/typescript-checker
```

## Configuring

You can configure the typescript checker in the `stryker.config.json` (or `stryker.config.js`) file.

```json
{
  "checkers": ["typescript"],
  "tsconfigFile": "tsconfig.json",
  "typescriptChecker": {
    "prioritizePerformanceOverAccuracy": true
  }
}
```

### `tsconfigFile` [`string`]

Default: `'tsconfig.json'`

The path to your [tsconfig](https://www.typescriptlang.org/docs/handbook/tsconfig-json.html). Project references _are supported_, `--build` mode will be enabled automatically when references are found in your tsconfig.json file.

_Note: the following compiler options are always overridden by @stryker-mutator/typescript-checker to avoid false positives. See [issue 391](https://github.com/stryker-mutator/stryker-js/issues/391#issue-259829320) for more information on this_

```json
{
  "compilerOptions": {
    "allowUnreachableCode": true,
    "noUnusedLocals": false,
    "noUnusedParameters": false
  }
}
```

### `typescriptChecker.prioritizePerformanceOverAccuracy` [`boolean`]

Default: `true`

Sets the performance strategy for the typescript-checker. Defaults to `true` which the fastest strategy with the consequence of losing some accuracy. The accuracy that is lost comes down to having mutants with a status other than `CompileError` while they should have this status. This result in a report that may not be 100% accurate. Setting this option to `false` results in an accurate report but may take (way) longer.

### `typescriptChecker.backend` [`"typescript"` | `"native"`]

Default: `'typescript'`

Selects the compiler implementation. The default uses your installed `typescript` package. The experimental `native` backend uses the TypeScript 7.1 Beta snapshot API to check in-memory changes against an immutable original project.

The native compiler is installed as the optional `@typescript/native` dependency, alongside the existing TypeScript compiler. Keep a TypeScript package with the legacy compiler API installed, such as `typescript@5.9.3`; both backends use it for configuration and diagnostic formatting. If you install without optional dependencies, install the native compiler explicitly:

```bash
npm install --save-dev @typescript/native@npm:typescript@7.1.0-beta
```

```json
{
  "checkers": ["typescript"],
  "typescriptChecker": {
    "backend": "native"
  }
}
```

The native backend requires compiler options supported by TypeScript 7.1. It does not fall back to the legacy compiler when configuration or compilation fails.

## Peer dependencies

The `@stryker-mutator/typescript-checker` package for `stryker` to enable `typescript` support. As such, you should make sure you have the correct versions of its dependencies installed:

- `typescript`
- `@stryker-mutator/core`

For the current versions, see the `peerDependencies` section in the [package.json](https://github.com/stryker-mutator/stryker-js/blob/master/packages/typescript-checker/package.json).

## Load the plugin

In this plugin the `@stryker-mutator/typescript-checker`' must be loaded into Stryker.
The easiest way to achieve this, is _not have a `plugins` section_ in your config file. That way, all plugins starting with `"@stryker-mutator/"` will be loaded.

If you do decide to choose specific modules, don't forget to add `"@stryker-mutator/typescript-checker"` to the list of plugins to load.
