const axios = require('axios');
const dotenv = require('dotenv');
const path = require('node:path');

const envPath = path.resolve(__dirname, '..', 'apps', 'api', '.env');

dotenv.config({ path: envPath });

const publisherId = process.env.AWIN_PUBLISHER_ID;
const apiToken = process.env.AWIN_API_TOKEN;
const apiBaseUrl = (process.env.AWIN_API_BASE_URL || 'https://api.awin.com').replace(/\/$/, '');
const endpoint = `${apiBaseUrl}/publishers/${publisherId}/programmes`;

const maskValue = (value = '') => {
  if (!value) return '(não definido)';
  if (value.length <= 6) return `${value.slice(0, 2)}***`;
  return `${value.slice(0, 4)}***${value.slice(-2)}`;
};

const printHeader = () => {
  console.log('Teste de integração AWIN');
  console.log(`Arquivo .env carregado: ${envPath}`);
  console.log(`Publisher ID: ${publisherId || '(não definido)'}`);
  console.log(`Endpoint: ${endpoint}`);
  console.log(`Token presente: ${apiToken ? `sim (${maskValue(apiToken)})` : 'não'}`);
  console.log('');
};

const validateEnv = () => {
  const missing = [];
  if (!publisherId) missing.push('AWIN_PUBLISHER_ID');
  if (!apiToken) missing.push('AWIN_API_TOKEN');

  if (missing.length) {
    console.error(`❌ variáveis ausentes: ${missing.join(', ')}`);
    process.exit(1);
  }
};

const main = async () => {
  printHeader();
  validateEnv();

  try {
    const response = await axios.get(endpoint, {
      headers: {
        Authorization: `Bearer ${apiToken}`,
        Accept: 'application/json'
      },
      timeout: 15000
    });

    const data = Array.isArray(response.data) ? response.data : response.data?.programmes || response.data;
    const preview = Array.isArray(data) ? data.slice(0, 5) : data;

    console.log(`Status da resposta: ${response.status}`);
    console.log('Primeiros resultados:');
    console.log(JSON.stringify(preview, null, 2));
    console.log('');
    console.log('✔ API funcionando');
  } catch (error) {
    const status = error.response?.status || null;
    const errorBody = error.response?.data || error.message;

    console.error(`Status da resposta: ${status || 'sem resposta'}`);
    console.error('Detalhes do erro:');
    console.error(typeof errorBody === 'string' ? errorBody : JSON.stringify(errorBody, null, 2));
    console.error('');

    if (status === 401 || status === 403) {
      console.error('❌ erro de autenticação');
      process.exit(1);
    }

    if (error.code === 'ECONNABORTED' || !status) {
      console.error('❌ erro de conexão');
      process.exit(1);
    }

    console.error('❌ erro na API');
    process.exit(1);
  }
};

main();
