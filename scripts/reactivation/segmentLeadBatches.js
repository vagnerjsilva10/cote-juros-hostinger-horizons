#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const args = Object.fromEntries(
  process.argv.slice(2).map((item) => {
    const [key, ...value] = item.replace(/^--/, '').split('=');
    return [key, value.join('=') || true];
  })
);

const inputPath = args.input;
const outputDir = args.outputDir || 'reactivation-batches';
const batchSize = Number(args.batchSize || 500);
const waveSize = Number(args.waveSize || batchSize);
const dryRun = Boolean(args.dryRun);

if (!inputPath || !Number.isFinite(batchSize) || batchSize < 1) {
  console.error('Usage: npm run reactivation:batches -- --input=leads-with-tokens.json --outputDir=batches --batchSize=500 [--waveSize=100] [--dryRun]');
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

const readRows = (filePath) => {
  const raw = fs.readFileSync(filePath, 'utf8').replace(/^\uFEFF/, '');
  if (filePath.endsWith('.json')) {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) throw new Error('JSON input must be an array.');
    return parsed;
  }

  const [headerLine, ...lines] = raw.trim().split(/\r?\n/);
  const headers = parseCsvLine(headerLine).map((item) => item.trim());
  return lines.filter(Boolean).map((line) => {
    const values = parseCsvLine(line).map((item) => item.trim());
    return Object.fromEntries(headers.map((header, index) => [header, values[index] || '']));
  });
};

const classifySegment = (lead) => {
  const income = Number(lead.income || lead.renda || 0);
  const hasPhone = Boolean(String(lead.phone || lead.telefone || '').replace(/\D/g, ''));
  const hasEmail = Boolean(lead.email);
  const hasGuarantee = ['true', '1', 'sim', 'yes'].includes(String(lead.hasGuarantee || lead.garantia || '').toLowerCase());
  const intent = String(lead.intent || lead.segment || '').toLowerCase();

  if (hasGuarantee) return 'garantia_prioritaria';
  if (intent.includes('hot') || income >= 7000) return 'alta_intencao';
  if (hasPhone && hasEmail) return 'engajado_multicanal';
  if (hasPhone) return 'whatsapp_first';
  if (hasEmail) return 'email_first';
  return 'enriquecimento';
};

const channelForSegment = (segment) => {
  if (['garantia_prioritaria', 'alta_intencao', 'whatsapp_first'].includes(segment)) return 'whatsapp';
  if (['email_first', 'engajado_multicanal'].includes(segment)) return 'email';
  return 'enrichment';
};

const rows = readRows(inputPath).map((lead) => {
  const segment = lead.segment || classifySegment(lead);
  return {
    ...lead,
    segment,
    preferredChannel: lead.preferredChannel || channelForSegment(segment)
  };
});

const grouped = rows.reduce((acc, lead) => {
  const key = lead.preferredChannel;
  acc[key] = acc[key] || [];
  acc[key].push(lead);
  return acc;
}, {});

const manifest = [];

Object.entries(grouped).forEach(([channel, channelRows]) => {
  for (let start = 0; start < channelRows.length; start += batchSize) {
    const chunk = channelRows.slice(start, start + batchSize);
    const batchNumber = Math.floor(start / batchSize) + 1;
    const fileName = `${channel}-batch-${String(batchNumber).padStart(3, '0')}.json`;
    const filePath = path.join(outputDir, fileName);
    const waves = [];
    for (let waveStart = 0; waveStart < chunk.length; waveStart += waveSize) {
      waves.push({
        wave: waves.length + 1,
        start: waveStart,
        count: chunk.slice(waveStart, waveStart + waveSize).length
      });
    }
    manifest.push({
      channel,
      fileName,
      count: chunk.length,
      waves,
      segments: [...new Set(chunk.map((lead) => lead.segment))]
    });
    if (!dryRun) {
      fs.mkdirSync(outputDir, { recursive: true });
      fs.writeFileSync(filePath, `${JSON.stringify(chunk, null, 2)}\n`);
    }
  }
});

if (!dryRun) {
  fs.writeFileSync(path.join(outputDir, 'manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`);
}

console.log(JSON.stringify({ inputPath, outputDir, batchSize, waveSize, dryRun, batches: manifest.length, rows: rows.length, manifest }, null, 2));
