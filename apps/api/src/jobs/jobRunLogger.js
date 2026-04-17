import { getPrisma } from '../lib/prisma.js';

export class JobRunLogger {
  constructor(jobName) {
    this.jobName = jobName;
    this.run = null;
  }

  async start(metadata = {}) {
    try {
      const prisma = getPrisma();
      this.run = await prisma.reactivationAutomationJobRun.create({
        data: {
          jobName: this.jobName,
          status: 'running',
          triggerSource: process.env.GITHUB_ACTIONS ? 'github_actions' : 'local',
          metadata,
        },
      });
    } catch (error) {
      console.warn(`[JobRunLogger] Could not start ${this.jobName}: ${error.message}`);
    }
    return this.run;
  }

  async finish(status, stats = {}, error = null) {
    if (!this.run) return;
    try {
      const prisma = getPrisma();
      const finishedAt = new Date();
      await prisma.reactivationAutomationJobRun.update({
        where: { id: this.run.id },
        data: {
          status,
          finishedAt,
          durationMs: finishedAt.getTime() - this.run.startedAt.getTime(),
          processedCount: stats.total ?? stats.processed ?? stats.fetched ?? stats.eligible ?? 0,
          successCount: stats.imported ?? stats.succeeded ?? stats.saved ?? stats.sent ?? 0,
          errorCount: stats.errors ?? stats.failed ?? 0,
          errorMessage: error ? String(error.message || error).slice(0, 240) : null,
          metadata: {
            ...this.run.metadata,
            stats,
          },
        },
      });
    } catch (finishError) {
      console.warn(`[JobRunLogger] Could not finish ${this.jobName}: ${finishError.message}`);
    }
  }
}
