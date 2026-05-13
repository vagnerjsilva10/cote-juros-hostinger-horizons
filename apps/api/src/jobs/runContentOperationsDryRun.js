import 'dotenv/config.js';
import { ContentOperationsEngine } from '../services/contentOperationsEngine.js';

const useLiveDiscovery = process.argv.includes('--live-discovery');

const simulation = await ContentOperationsEngine.simulateWeek({
  days: 7,
  dailyTarget: 3,
  dryRun: true,
  useLiveDiscovery,
});

console.log(JSON.stringify(ContentOperationsEngine.toCompactReport(simulation), null, 2));
