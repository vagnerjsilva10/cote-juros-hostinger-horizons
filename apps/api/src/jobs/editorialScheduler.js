import 'dotenv/config.js';
import cron from 'node-cron';
import { spawn } from 'node:child_process';
import { DEFAULT_EDITORIAL_SCHEDULE } from '../services/editorialConfig.js';

const runPipeline = (trigger) =>
  new Promise((resolve, reject) => {
    const child = spawn(process.execPath, ['src/jobs/runEditorialPipeline.js', '--limit=1', `--trigger=${trigger}`], {
      cwd: process.cwd(),
      env: process.env,
      stdio: 'inherit'
    });

    child.on('error', reject);
    child.on('exit', (code) => {
      if (code === 0) resolve();
      else reject(new Error(`Editorial pipeline exited with code ${code}`));
    });
  });

const schedule = (expression, trigger) => {
  cron.schedule(expression, async () => {
    console.log(`[editorial:${trigger}] triggered at ${new Date().toISOString()}`);
    try {
      await runPipeline(trigger);
      console.log(`[editorial:${trigger}] completed`);
    } catch (error) {
      console.error(`[editorial:${trigger}] failed`, error);
    }
  });
};

console.log('[editorial-scheduler] starting');
schedule(DEFAULT_EDITORIAL_SCHEDULE.morning, 'cron-morning');
schedule(DEFAULT_EDITORIAL_SCHEDULE.afternoon, 'cron-afternoon');
schedule(DEFAULT_EDITORIAL_SCHEDULE.evening, 'cron-evening');
console.log('[editorial-scheduler] jobs scheduled', DEFAULT_EDITORIAL_SCHEDULE);
