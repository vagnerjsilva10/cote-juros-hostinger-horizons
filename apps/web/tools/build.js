#!/usr/bin/env node

import { spawnSync } from 'node:child_process';
import { build } from 'vite';

const runNodeScript = (script, { optional = false } = {}) => {
  const result = spawnSync(process.execPath, [script], {
    cwd: process.cwd(),
    stdio: 'inherit',
    shell: false
  });

  if (result.status !== 0 && !optional) {
    process.exit(result.status || 1);
  }
};

runNodeScript('tools/generate-llms.js', { optional: true });
runNodeScript('tools/generate-sitemap.js');

await build({
  build: {
    outDir: 'dist'
  }
});
