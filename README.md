# npm-package-template

npm package を作るための @mizdra 専用プロジェクトテンプレート。

## 技術スタック

- npm
- TypeScript
- ESM
- Prettier
- ESLint
- Vitest
- GitHub Actions
- vscode 向けの各種設定ファイル (`extensions.json`, `launch.json`, `settings.json`)

## Usage

```bash
cd app_name
wget -O - https://github.com/mizdra/npm-package-template/archive/main.tar.gz | tar xzvf - --strip=1
grep -l 'CC0-1.0' | xargs sed -i '' -e 's/CC0-1.0/MIT/g'
license mit > LICENSE

## Init project
npm install
npm run dev
```

## License

CC0-1.0
