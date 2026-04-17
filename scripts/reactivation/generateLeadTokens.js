#!/usr/bin/env node
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const args = Object.fromEntries(
  process.argv.slice(2).map((item) => {
    const [key, ...value] = item.replace(/^--/, '').split('=');
    return [key, value.join('=') || true];
  })
);

const inputPath = args.input;
const outputPath = args.output || 'reactivation-leads-with-tokens.json';
const manifestPath = args.manifest || `${outputPath}.manifest.json`;
const baseUrl = String(args.baseUrl || process.env.REACTIVATION_BASE_URL || 'https://www.cotejuros.com.br').replace(/\/$/, '');
const tokenSecret = process.env.REACTIVATION_TOKEN_SECRET || process.env.APP_SECRET;
const dryRun = Boolean(args.dryRun);

const usage = () => {
  console.error('Usage: npm run reactivation:tokens -- --input=leads.json --output=out/leads-with-tokens.json --baseUrl=https://finance.cotejuros.com.br [--batchId=pilot_001] [--dryRun]');
  process.exit(1);
};

if (!inputPath) usage();
if (!tokenSecret || tokenSecret.length < 32) {
  console.error('REACTIVATION_TOKEN_SECRET or APP_SECRET must be configured with at least 32 characters.');
  process.exit(1);
}

const parseCsvLine = (line) => {
  const values = [];
  let current = '';
  let quoted = false;
  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];
    const next = line[index + 1];
    if (char === '"' && quoted && next === '"') {
      current += '"';
      index += 1;
    } else if (char === '"') {
      quoted = !quoted;
    } else if (char === ',' && !quoted) {
      values.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  values.push(current);
  return values;
};

const readInput = (filePath) => {
  const raw = fs.readFileSync(filePath, 'utf8').replace(/^\uFEFF/, '');
  if (filePath.endsWith('.json')) {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) throw new Error('JSON input must be an array of leads.');
    return parsed;
  }

  const [headerLine, ...lines] = raw.trim().split(/\r?\n/);
  const headers = parseCsvLine(headerLine).map((item) => item.trim());
  return lines.filter(Boolean).map((line) => {
    const values = parseCsvLine(line).map((item) => item.trim());
    return Object.fromEntries(headers.map((header, index) => [header, values[index] || '']));
  });
};

const writeJson = (filePath, data) => {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, `${JSON.stringify(data, null, 2)}\n`);
};

const hashToken = (token) => crypto.createHmac('sha256', tokenSecret).update(token).digest('hex');
const generateToken = () => crypto.randomBytes(24).toString('base64url');
const normalizeExternalId = (lead, batchId, index) => String(lead.externalLeadId || lead.id || `${batchId}_${index + 1}`).trim();

const leads = readInput(inputPath);
const batchId = args.batchId || `batch_${new Date().toISOString().slice(0, 10).replace(/-/g, '')}`;
const seen = new Set();
const duplicates = [];

const output = leads.flatMap((lead, index) => {
  const externalLeadId = normalizeExternalId(lead, batchId, index);
  const dedupeKey = `${batchId}:${externalLeadId}`;
  if (seen.has(dedupeKey)) {
    duplicates.push({ externalLeadId, index });
    return [];
  }
  seen.add(dedupeKey);

  const token = generateToken();
  return [{
    ...lead,
    externalLeadId,
    batchId: lead.batchId || batchId,
    token,
    tokenHash: hashToken(token),
    reactivationUrl: `${baseUrl}/r/${token}`,
    tokenLast4: token.slice(-4)
  }];
});

const manifest = {
  inputPath,
  outputPath,
  batchId,
  baseUrl,
  dryRun,
  inputRows: leads.length,
  outputRows: output.length,
  duplicates: duplicates.length,
  duplicateSamples: duplicates.slice(0, 20),
  generatedAt: new Date().toISOString()
};

if (!dryRun) {
  writeJson(outputPath, output);
  writeJson(manifestPath, manifest);
}

console.log(JSON.stringify(manifest, null, 2));
