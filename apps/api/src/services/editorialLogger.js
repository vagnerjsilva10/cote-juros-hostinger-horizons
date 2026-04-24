import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { EDITORIAL_LOG_DIR } from './editorialConfig.js';

const resolveLogPath = (name = 'editorial.log') => {
  if (process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME) {
    return path.join('/tmp', 'cote-juros-editorial', name);
  }

  const dirPath = fileURLToPath(EDITORIAL_LOG_DIR);
  return path.join(dirPath, name);
};

const normalizeError = (error) => {
  if (!error) return null;
  if (error instanceof Error) {
    return {
      name: error.name,
      message: error.message,
      stack: error.stack
    };
  }

  return {
    message: String(error)
  };
};

export const appendEditorialLog = async (event, payload = {}) => {
  const entry = {
    timestamp: new Date().toISOString(),
    event,
    ...payload
  };
  const line = JSON.stringify(entry);

  try {
    const logPath = resolveLogPath();
    await fs.mkdir(path.dirname(logPath), { recursive: true });
    await fs.appendFile(logPath, `${line}\n`, 'utf8');
  } catch (error) {
    console.log('[editorial-log-fallback]', entry, error?.message || String(error));
  }
};

export const createEditorialLogger = (scope) => ({
  async info(message, metadata = {}) {
    await appendEditorialLog('info', { scope, message, metadata });
  },
  async warn(message, metadata = {}) {
    await appendEditorialLog('warn', { scope, message, metadata });
  },
  async error(message, error, metadata = {}) {
    await appendEditorialLog('error', {
      scope,
      message,
      metadata,
      error: normalizeError(error)
    });
  }
});
