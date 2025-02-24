import type { AtImportTokenImporter, AtValueTokenImporter, Token } from '../parser/css-module-parser.js';

const fakeLoc = { start: 0, end: 0 };

export function createToken(name: string): Token {
  return { name, loc: fakeLoc };
}

export function createAtImportTokenImporter(from: string): AtImportTokenImporter {
  return {
    type: 'import',
    from,
    fromLoc: fakeLoc,
  };
}

export function createAtValueTokenImporter(from: string, valueNames: string[]): AtValueTokenImporter {
  return {
    type: 'value',
    from,
    values: valueNames.map((name) => ({ name, loc: fakeLoc })),
    fromLoc: fakeLoc,
  };
}
