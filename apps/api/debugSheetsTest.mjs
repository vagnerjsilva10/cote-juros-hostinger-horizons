import 'dotenv/config.js';
import { google } from 'googleapis';
import { GoogleAuth } from 'google-auth-library';

async function test() {
  try {
    const credentialsJson = JSON.parse(process.env.GOOGLE_SHEETS_CREDENTIALS_JSON);
    console.log('CREDS OK', credentialsJson.client_email);
    const auth = new GoogleAuth({
      credentials: credentialsJson,
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });
    const sheets = google.sheets({ version: 'v4', auth });
    const res = await sheets.spreadsheets.values.get({
      spreadsheetId: process.env.GOOGLE_SHEETS_REACTIVATION_ID,
      range: 'leads_queue!A1:A1',
    });
    console.log('OK', res.data.values);
  } catch (err) {
    console.error('ERR', err.message);
    if (err.response) {
      console.error('RESPONSE', JSON.stringify(err.response.data, null, 2));
    } else {
      console.error(err);
    }
  }
}

test();
