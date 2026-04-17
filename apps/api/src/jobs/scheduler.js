import 'dotenv/config.js';
import cron from 'node-cron';
import { spawn } from 'node:child_process';

class JobScheduler {
  constructor() {
    this.validateEnv();
    this.apiBaseUrl = process.env.COTE_API_BASE_URL;
    this.apiToken = process.env.COTE_API_TOKEN;
    this.spreadsheetId = process.env.GOOGLE_SHEETS_REACTIVATION_ID;
    this.queueAutoPrepare = process.env.REACTIVATION_QUEUE_AUTO_PREPARE === 'true';
    this.tasks = [];
  }

  validateEnv() {
    const required = [
      'COTE_API_BASE_URL',
      'COTE_API_TOKEN',
      'GOOGLE_SHEETS_REACTIVATION_ID',
    ];

    const missing = required.filter(key => !process.env[key]);
    if (missing.length > 0) {
      throw new Error(`Missing environment variables: ${missing.join(', ')}`);
    }
  }

  start() {
    console.log('[Scheduler] Starting job scheduler');
    console.log(`[Scheduler] API Base URL: ${this.apiBaseUrl}`);
    console.log(`[Scheduler] Spreadsheet ID: ${this.spreadsheetId}`);

    if (this.queueAutoPrepare) {
      this.scheduleTask(
        process.env.REACTIVATION_QUEUE_PREPARE_CRON || '0 9 * * 1-5',
        'prepareReactivationQueue',
        () => this.runPrepareQueue()
      );
    }

    // Import leads every 5 minutes
    this.scheduleTask(
      '*/5 * * * *',
      'importLeadsFromSheets',
      () => this.runImportLeads()
    );

    // Retry deliveries every 15 minutes
    this.scheduleTask(
      '*/15 * * * *',
      'retryPendingDeliveries',
      () => this.runRetryDeliveries()
    );

    // Send the next safe email wave. The email job defaults to dry-run unless
    // REACTIVATION_EMAIL_ENABLED=true and REACTIVATION_EMAIL_DRY_RUN=false.
    this.scheduleTask(
      process.env.REACTIVATION_EMAIL_CRON || '30 9-17 * * 1-5',
      'sendReactivationEmails',
      () => this.runSendEmails()
    );

    // Sync KPIs every 60 minutes
    this.scheduleTask(
      '0 * * * *',
      'syncReactivationKpis',
      () => this.runSyncKpis()
    );

    console.log('[Scheduler] All jobs scheduled. Press Ctrl+C to stop.');

    // Handle graceful shutdown
    process.on('SIGINT', () => {
      console.log('[Scheduler] Shutting down gracefully...');
      this.tasks.forEach(task => task.stop());
      console.log('[Scheduler] All tasks stopped');
      process.exit(0);
    });
  }

  scheduleTask(cronExpression, taskName, taskFn) {
    const task = cron.schedule(cronExpression, async () => {
      console.log(`[${taskName}] Task triggered at ${new Date().toISOString()}`);
      try {
        await taskFn();
        console.log(`[${taskName}] Task completed successfully`);
      } catch (error) {
        console.error(`[${taskName}] Task failed:`, error.message);
      }
    });

    this.tasks.push(task);
    console.log(`[Scheduler] Task '${taskName}' scheduled with cron: ${cronExpression}`);
  }

  async runImportLeads() {
    await this.runScript('src/jobs/importLeadsFromSheets.js');
  }

  async runPrepareQueue() {
    const limit = process.env.REACTIVATION_QUEUE_LIMIT ? [process.env.REACTIVATION_QUEUE_LIMIT] : [];
    await this.runScript('scripts/prepareReactivationQueue.js', limit);
  }

  async runRetryDeliveries() {
    await this.runScript('src/jobs/retryPendingDeliveries.js');
  }

  async runSendEmails() {
    await this.runScript('src/jobs/sendReactivationEmails.js');
  }

  async runSyncKpis() {
    const batchId = process.env.REACTIVATION_BATCH_ID;
    if (!batchId) {
      console.warn('[syncReactivationKpis] REACTIVATION_BATCH_ID not configured; skipping');
      return;
    }
    await this.runScript('src/jobs/syncReactivationKpis.js', [batchId]);
  }

  runScript(scriptPath, args = []) {
    return new Promise((resolve, reject) => {
      const child = spawn(process.execPath, [scriptPath, ...args], {
        cwd: process.cwd(),
        env: process.env,
        stdio: 'inherit'
      });

      child.on('error', reject);
      child.on('exit', (code) => {
        if (code === 0) resolve();
        else reject(new Error(`${scriptPath} exited with code ${code}`));
      });
    });
  }
}

// Start scheduler
const scheduler = new JobScheduler();
scheduler.start();
