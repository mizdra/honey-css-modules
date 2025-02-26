# Contributing

This is a guide for contributors.

## How to dev

- `npm run build`: Build for production
- `npm run dev`: Run for development
- `npm run lint`: Run static-checking
- `npm run test`: Run tests

## How to release

- Wait for passing CI...
- ```bash
  git switch main && git pull
  ```
- ```bash
  npm run build -- --clean && npm run build
  ```
- ```bash
  npx @changesets/cli version
  ```
- ```bash
  npx @changesets/cli publish
  ```
- ```bash
  git push --follow-tags
  ```
