import 'dotenv/config.js';
import { google } from 'googleapis';
import { GoogleAuth } from 'google-auth-library';

const decodeBase64IfNeeded = (value) => {
  const compact = String(value || '').trim();
  if (!compact || compact.startsWith('{') || compact.startsWith('"') || compact.startsWith("'")) {
    return compact;
  }

  try {
    const decoded = Buffer.from(compact, 'base64').toString('utf8').trim();
    return decoded.startsWith('{') ? decoded : compact;
  } catch {
    return compact;
  }
};

const stripWrappingQuotes = (value) => {
  let current = String(value || '').trim();
  for (let index = 0; index < 2; index += 1) {
    const first = current[0];
    const last = current[current.length - 1];
    if ((first === '"' && last === '"') || (first === "'" && last === "'")) {
      current = current.slice(1, -1).trim();
      continue;
    }
    break;
  }
  return current;
};

const parseSingleQuotedJson = (value) => {
  const normalized = value
    .replace(/([{,]\s*)'([^'\\]+?)'\s*:/g, '$1"$2":')
    .replace(/:\s*'([^'\\]*(?:\\.[^'\\]*)*)'/g, (_, content) => `: "${content.replace(/"/g, '\\"')}"`);

  return JSON.parse(normalized);
};

const parseGoogleCredentials = (rawValue) => {
  const candidates = [];
  const decoded = decodeBase64IfNeeded(rawValue);
  candidates.push(decoded);
  candidates.push(stripWrappingQuotes(decoded));

  let lastError = null;
  for (const candidate of [...new Set(candidates)]) {
    if (!candidate) continue;
    try {
      return JSON.parse(candidate);
    } catch (error) {
      lastError = error;
    }

    if (candidate.trim().startsWith("{'")) {
      try {
        return parseSingleQuotedJson(candidate);
      } catch (error) {
        lastError = error;
      }
    }
  }

  throw lastError || new Error('Invalid Google credentials JSON');
};

class GoogleSheetsClient {
  constructor() {
    this.sheets = null;
    this.credentials = null;
  }

  async getSheets() {
    if (!this.sheets) {
      await this.authenticate();
    }
    return this.sheets;
  }

  async authenticate() {
    if (!process.env.GOOGLE_SHEETS_CREDENTIALS_JSON) {
      throw new Error('GOOGLE_SHEETS_CREDENTIALS_JSON not configured');
    }

    try {
      const credentialsJson = parseGoogleCredentials(process.env.GOOGLE_SHEETS_CREDENTIALS_JSON);
      const authClient = new GoogleAuth({
        credentials: credentialsJson,
        scopes: ['https://www.googleapis.com/auth/spreadsheets'],
      });

      this.sheets = google.sheets({
        version: 'v4',
        auth: authClient,
      });

      this.credentials = credentialsJson;
    } catch (error) {
      throw new Error(`Failed to authenticate with Google Sheets: ${error.message}`);
    }
  }

  async readRows(spreadsheetId, sheetName) {
    const sheets = await this.getSheets();

    try {
      const response = await this.sheets.spreadsheets.values.get({
        spreadsheetId,
        range: `${sheetName}!A:AZ`,
      });

      const rows = response.data.values || [];
      if (rows.length === 0) {
        return [];
      }

      // First row is header
      const headers = rows[0];
      const dataRows = rows.slice(1).map((row, index) => {
        const obj = {};
        headers.forEach((header, colIndex) => {
          obj[header] = row[colIndex] || null;
        });
        obj._rowIndex = index + 2; // +2 because 1-indexed and +1 for header
        return obj;
      });

      return dataRows;
    } catch (error) {
      throw new Error(`Failed to read from Google Sheets: ${this.formatSheetsError(error)}`);
    }
  }

  async getSpreadsheetInfo(spreadsheetId) {
    const sheets = await this.getSheets();

    try {
      const response = await sheets.spreadsheets.get({
        spreadsheetId,
        fields: 'spreadsheetId,properties.title,sheets.properties.sheetId,sheets.properties.title',
      });

      return {
        id: response.data.spreadsheetId,
        title: response.data.properties?.title,
        sheets: (response.data.sheets || []).map((sheet) => ({
          id: sheet.properties.sheetId,
          title: sheet.properties.title,
        })),
      };
    } catch (error) {
      throw new Error(`Failed to inspect Google Sheets document: ${this.formatSheetsError(error)}`);
    }
  }

  async ensureSheet(spreadsheetId, sheetName) {
    const sheets = await this.getSheets();
    const info = await this.getSpreadsheetInfo(spreadsheetId);
    const exists = info.sheets.some((sheet) => sheet.title === sheetName);

    if (exists) {
      return { created: false, sheetName };
    }

    try {
      await sheets.spreadsheets.batchUpdate({
        spreadsheetId,
        resource: {
          requests: [
            {
              addSheet: {
                properties: {
                  title: sheetName,
                },
              },
            },
          ],
        },
      });

      return { created: true, sheetName };
    } catch (error) {
      throw new Error(`Failed to create sheet "${sheetName}": ${this.formatSheetsError(error)}`);
    }
  }

  async ensureHeaders(spreadsheetId, sheetName, expectedHeaders) {
    const sheets = await this.getSheets();
    await this.ensureSheet(spreadsheetId, sheetName);

    try {
      const currentHeaders = await this._getHeaders(spreadsheetId, sheetName);
      const missingHeaders = expectedHeaders.filter((header) => !currentHeaders.includes(header));
      const finalHeaders = currentHeaders.length > 0
        ? [...currentHeaders, ...missingHeaders]
        : expectedHeaders;

      if (currentHeaders.length === 0 || missingHeaders.length > 0) {
        await sheets.spreadsheets.values.update({
          spreadsheetId,
          range: `${sheetName}!A1:AZ1`,
          valueInputOption: 'USER_ENTERED',
          resource: { values: [finalHeaders] },
        });
      }

      return {
        sheetName,
        createdHeaders: currentHeaders.length === 0,
        missingHeadersAdded: missingHeaders,
        headers: finalHeaders,
      };
    } catch (error) {
      throw new Error(`Failed to ensure headers for "${sheetName}": ${this.formatSheetsError(error)}`);
    }
  }

  async updateRow(spreadsheetId, sheetName, rowIndex, data) {
    const sheets = await this.getSheets();

    try {
      const headers = await this._getHeaders(spreadsheetId, sheetName);
      const current = await this.sheets.spreadsheets.values.get({
        spreadsheetId,
        range: `${sheetName}!A${rowIndex}:AZ${rowIndex}`,
      });
      const currentValues = current.data.values?.[0] || [];
      const values = [
        headers.map((header, index) => {
          if (Object.prototype.hasOwnProperty.call(data, header)) return data[header] ?? '';
          return currentValues[index] ?? '';
        })
      ];

      const response = await this.sheets.spreadsheets.values.update({
        spreadsheetId,
        range: `${sheetName}!A${rowIndex}:AZ${rowIndex}`,
        valueInputOption: 'USER_ENTERED',
        resource: { values },
      });

      return response.data;
    } catch (error) {
      throw new Error(`Failed to update row in Google Sheets: ${this.formatSheetsError(error)}`);
    }
  }

  async _getHeaders(spreadsheetId, sheetName) {
    try {
      const response = await this.sheets.spreadsheets.values.get({
        spreadsheetId,
        range: `${sheetName}!A1:AZ1`,
      });

      return response.data.values?.[0] || [];
    } catch (error) {
      throw new Error(`Failed to get headers: ${this.formatSheetsError(error)}`);
    }
  }

  async appendRows(spreadsheetId, sheetName, rows) {
    const sheets = await this.getSheets();

    try {
      const headers = await this._getHeaders(spreadsheetId, sheetName);
      const values = rows.map((row) => {
        if (Array.isArray(row)) return row;
        return headers.map((header) => row[header] ?? '');
      });
      const response = await this.sheets.spreadsheets.values.append({
        spreadsheetId,
        range: `${sheetName}!A:AZ`,
        valueInputOption: 'USER_ENTERED',
        resource: { values },
      });

      return response.data;
    } catch (error) {
      throw new Error(`Failed to append rows to Google Sheets: ${this.formatSheetsError(error)}`);
    }
  }

  formatSheetsError(error) {
    const message = error.response?.data?.error?.message || error.message;
    if (message?.includes('This operation is not supported for this document')) {
      return `${message}. Use a native Google Sheets spreadsheet ID, not an uploaded .xlsx file ID.`;
    }
    return message;
  }
}

export const googleSheetsClient = new GoogleSheetsClient();
