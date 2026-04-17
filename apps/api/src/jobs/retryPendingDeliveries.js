import 'dotenv/config.js';
import axios from 'axios';

class RetryPendingDeliveriesJob {
  constructor() {
    this.validateEnv();
    this.apiBaseUrl = process.env.COTE_API_BASE_URL;
    this.apiToken = process.env.COTE_API_TOKEN;
    this.stats = {
      processed: 0,
      succeeded: 0,
      failed: 0,
    };
  }

  validateEnv() {
    const required = ['COTE_API_BASE_URL', 'COTE_API_TOKEN'];
    const missing = required.filter(key => !process.env[key]);

    if (missing.length > 0) {
      throw new Error(`Missing environment variables: ${missing.join(', ')}`);
    }
  }

  async run() {
    console.log('[RetryDeliveries] Job started');

    try {
      const result = await this.retryDueDeliveries();

      this.stats.processed = result.processed || 0;
      this.stats.succeeded = result.succeeded || 0;
      this.stats.failed = result.failed || 0;

      console.log('[RetryDeliveries] Job completed');
      console.log(
        `[RetryDeliveries] Summary: ${this.stats.processed} processed, ` +
          `${this.stats.succeeded} succeeded, ${this.stats.failed} failed`
      );

      return this.stats;
    } catch (error) {
      console.error('[RetryDeliveries] Job failed:', error.message);
      throw error;
    }
  }

  async retryDueDeliveries() {
    try {
      const url = `${this.apiBaseUrl}/api/reactivation/deliveries/retry-due`;

      const response = await axios.post(
        url,
        {},
        {
          headers: {
            'Authorization': `Bearer ${this.apiToken}`,
            'Content-Type': 'application/json',
          },
          timeout: 60000,
        }
      );

      if (response.status !== 200 && response.status !== 201) {
        throw new Error(`API returned status ${response.status}`);
      }

      const data = response.data?.data || response.data;
      const results = Array.isArray(data.results) ? data.results : [];

      if (data.errors && Array.isArray(data.errors) && data.errors.length > 0) {
        console.warn(`[RetryDeliveries] Errors during retry:`);
        data.errors.forEach((error, index) => {
          const sanitized = this.sanitizeError(error);
          console.warn(`  [${index + 1}] ${sanitized}`);
        });
      }

      return {
        processed: data.processed || 0,
        succeeded: data.succeeded || results.filter((item) => item.status === 'delivery_success').length,
        failed: data.failed || results.filter((item) => item.status === 'delivery_failed').length,
      };
    } catch (error) {
      if (error.response) {
        throw new Error(
          `API error (${error.response.status}): ${error.response.data?.message || error.message}`
        );
      }
      throw error;
    }
  }

  sanitizeError(message) {
    // Remove sensitive information
    return message
      .replace(/Bearer\s+\S+/g, 'Bearer [REDACTED]')
      .replace(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g, '[EMAIL]')
      .replace(/\b\d{3}\.\d{3}\.\d{3}-\d{2}\b/g, '[CPF]')
      .replace(/\b\d{2}\s?\d{4,5}-?\d{4}\b/g, '[PHONE]')
      .substring(0, 300);
  }
}

// Run job
const job = new RetryPendingDeliveriesJob();
job.run().catch(error => {
  console.error('[RetryDeliveries] Fatal error:', error);
  process.exit(1);
});
