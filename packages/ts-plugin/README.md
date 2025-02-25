# `@css-modules-kit/ts-plugin`

A TypeScript Language Service Plugin for CSS Modules

## Features

- "Go to Definition" enables jumping from `*.ts` to `*.module.css`.
- Rename class names in either `*.ts` or `*.module.css`.
- Automatically update import statements when moving `*.module.css`.

## Installation

```bash
npm i -D @css-modules-kit/ts-plugin
```

## Usage

Add the "plugin" option to your tsconfig.json file. For example:

```json
{
  "compilerOptions": {
    "plugins": [{ "name": "@css-modules-kit/ts-plugin" }]
  }
}
```

## Options

See [css-modules-kit's README](https://github.com/mizdra/css-modules-kit?tab=readme-ov-file#options).
