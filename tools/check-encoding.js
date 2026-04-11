const fs = require('node:fs');
const path = require('node:path');
const { TextDecoder } = require('node:util');

const ROOT = process.cwd();
const SCAN_ROOTS = ['apps', 'docs'];
const TEXT_EXTENSIONS = new Set([
  '.js',
  '.jsx',
  '.ts',
  '.tsx',
  '.json',
  '.md',
  '.html',
  '.css',
  '.mjs',
  '.cjs',
  '.sql',
  '.yml',
  '.yaml'
]);

const SKIP_DIRS = new Set([
  '.git',
  'node_modules',
  'dist',
  'build',
  '.next',
  '.turbo',
  'coverage'
]);

const MOJIBAKE_PATTERNS = [
  /\u00C3[\u00A0-\u00BF]/u,
  /\u00C2[\u00A0-\u00BF]/u,
  /\u00E2\u20AC[\u0098-\u00BF]/u,
  /\uFFFD/u
];

const MOJIBAKE_ALLOWLIST = new Set([
  path.normalize('apps/web/src/lib/textEncoding.js'),
  path.normalize('docs/encoding.md')
]);

const utf8Decoder = new TextDecoder('utf-8', { fatal: true });

const isTextFile = (filePath) => TEXT_EXTENSIONS.has(path.extname(filePath).toLowerCase());

const walkFiles = (dir) => {
  const out = [];
  if (!fs.existsSync(dir)) return out;

  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (!SKIP_DIRS.has(entry.name)) {
        out.push(...walkFiles(fullPath));
      }
      continue;
    }

    if (entry.isFile() && isTextFile(fullPath)) {
      out.push(fullPath);
    }
  }

  return out;
};

const rel = (filePath) => path.relative(ROOT, filePath).replaceAll('\\', '/');

const hasMojibake = (filePath, text) => {
  const normalizedPath = path.normalize(path.relative(ROOT, filePath));
  if (MOJIBAKE_ALLOWLIST.has(normalizedPath)) return false;
  return MOJIBAKE_PATTERNS.some((pattern) => pattern.test(text));
};

const main = () => {
  const targets = SCAN_ROOTS.map((root) => path.join(ROOT, root));
  const files = targets.flatMap(walkFiles);

  const nonUtf8 = [];
  const mojibake = [];

  for (const filePath of files) {
    const bytes = fs.readFileSync(filePath);
    let text = null;

    try {
      text = utf8Decoder.decode(bytes);
    } catch {
      nonUtf8.push(filePath);
      continue;
    }

    if (hasMojibake(filePath, text)) {
      mojibake.push(filePath);
    }
  }

  if (!nonUtf8.length && !mojibake.length) {
    console.log(`Encoding check passed (${files.length} files scanned).`);
    return;
  }

  if (nonUtf8.length) {
    console.error('\nFiles that are not valid UTF-8:');
    for (const filePath of nonUtf8) {
      console.error(`- ${rel(filePath)}`);
    }
  }

  if (mojibake.length) {
    console.error('\nFiles with potential mojibake sequences:');
    for (const filePath of mojibake) {
      console.error(`- ${rel(filePath)}`);
    }
  }

  process.exitCode = 1;
};

main();
