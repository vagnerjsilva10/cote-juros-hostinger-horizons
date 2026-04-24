import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { EDITORIAL_LOG_DIR } from './editorialConfig.js';

const resolveLogPath = (name = 'editorial.log') => {
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
  const dirPath = path.dirname(resolveLogPath());
  await fs.mkdir(dirPath, { recursive: true });

  const line = JSON.stringify({
    timestamp: new Date().toISOString(),
    event,
    ...payload
  });

  await fs.appendFile(resolveLogPath(), `${line}\n`, 'utf8');
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
