import cron from 'node-cron';
import { BlogImageAutomationService } from '../services/blogImage/automationService.js';

const BLOG_IMAGE_SCHEDULE = {
  morning: process.env.BLOG_IMAGE_CRON_MORNING || '20 8 * * *',
  afternoon: process.env.BLOG_IMAGE_CRON_AFTERNOON || '20 14 * * *',
  evening: process.env.BLOG_IMAGE_CRON_EVENING || '20 20 * * *'
};

const schedule = (expression, label) => {
  cron.schedule(expression, async () => {
    try {
      const result = await BlogImageAutomationService.processNextArticle({ trigger: label });
      console.log(`[blog-image-scheduler] ${label}`, result);
    } catch (error) {
      console.error(`[blog-image-scheduler] ${label} failed`, error);
    }
  });
};

console.log('[blog-image-scheduler] starting');
schedule(BLOG_IMAGE_SCHEDULE.morning, 'cron-morning');
schedule(BLOG_IMAGE_SCHEDULE.afternoon, 'cron-afternoon');
schedule(BLOG_IMAGE_SCHEDULE.evening, 'cron-evening');
console.log('[blog-image-scheduler] jobs scheduled', BLOG_IMAGE_SCHEDULE);
