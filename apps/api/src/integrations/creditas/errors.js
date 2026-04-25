export class CreditasIntegrationError extends Error {
  constructor(message, options = {}) {
    super(message);
    this.name = this.constructor.name;
    this.code = options.code || null;
    this.statusCode = options.statusCode || 500;
    this.details = options.details || null;
    this.expose = options.expose ?? true;
  }
}

export class CreditasNotConfiguredError extends CreditasIntegrationError {
  constructor(message = 'Creditas integration is not configured.', options = {}) {
    super(message, { ...options, statusCode: options.statusCode || 503, code: options.code || 'CREDITAS_NOT_CONFIGURED' });
  }
}

export class CreditasApiError extends CreditasIntegrationError {
  constructor(message, options = {}) {
    super(message, { ...options, statusCode: options.statusCode || 502, code: options.code || 'CREDITAS_API_ERROR' });
  }
}

