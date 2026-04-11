export class JurosBaixosIntegrationError extends Error {
  constructor(message, options = {}) {
    super(message);
    this.name = this.constructor.name;
    this.code = options.code || null;
    this.statusCode = options.statusCode || 500;
    this.details = options.details || null;
    this.expose = options.expose ?? true;
  }
}

export class IntegrationConfigurationError extends JurosBaixosIntegrationError {
  constructor(message, options = {}) {
    super(message, { ...options, statusCode: options.statusCode || 500, code: options.code || 'JB_CONFIG_ERROR' });
  }
}

export class JurosBaixosApiError extends JurosBaixosIntegrationError {
  constructor(message, options = {}) {
    super(message, { ...options, statusCode: options.statusCode || 502, code: options.code || 'JB_API_ERROR' });
  }
}

export class JurosBaixosNotConfiguredError extends JurosBaixosIntegrationError {
  constructor(message = 'Juros Baixos integration is not configured.', options = {}) {
    super(message, { ...options, statusCode: options.statusCode || 503, code: options.code || 'JB_NOT_CONFIGURED' });
  }
}
