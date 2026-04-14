const axios = require('axios');
const dotenv = require('dotenv');
const path = require('node:path');

const envPath = path.resolve(__dirname, '..', 'apps', 'api', '.env');

dotenv.config({ path: envPath });

const publisherId = process.env.AWIN_PUBLISHER_ID;
const apiToken = process.env.AWIN_API_TOKEN;
const apiBaseUrl = (process.env.AWIN_API_BASE_URL || 'https://api.awin.com').replace(/\/$/, '');
const advertiserId = process.argv[2] || process.env.AWIN_TEST_ADVERTISER_ID || '';
const destinationUrl =
  process.argv[3] ||
  process.env.AWIN_TEST_DESTINATION_URL ||
  'https://www.cotejuros.com.br/emprestimos';
const clickref = process.argv[4] || process.env.AWIN_TEST_CLICKREF || 'cote-juros|linkbuilder|teste|desktop';

const endpoint = `${apiBaseUrl}/publishers/${publisherId}/link-builder`;

const maskValue = (value = '') => {
  if (!value) return '(não definido)';
  if (value.length <= 6) return `${value.slice(0, 2)}***`;
  return `${value.slice(0, 4)}***${value.slice(-2)}`;
};

const printHeader = () => {
  console.log('Teste Link Builder AWIN');
  console.log(`Arquivo .env carregado: ${envPath}`);
  console.log(`Publisher ID: ${publisherId || '(não definido)'}`);
  console.log(`Advertiser ID: ${advertiserId || '(não definido)'}`);
  console.log(`Endpoint: ${endpoint}`);
  console.log(`Destination URL: ${destinationUrl}`);
  console.log(`Clickref: ${clickref}`);
  console.log(`Token presente: ${apiToken ? `sim (${maskValue(apiToken)})` : 'não'}`);
  console.log('');
};

const validateEnv = () => {
  const missing = [];
  if (!publisherId) missing.push('AWIN_PUBLISHER_ID');
  if (!apiToken) missing.push('AWIN_API_TOKEN');
  if (!advertiserId) missing.push('advertiserId (argv[2] ou AWIN_TEST_ADVERTISER_ID)');

  if (missing.length) {
    console.error(`❌ variáveis ausentes: ${missing.join(', ')}`);
    console.error('');
    console.error('Uso:');
    console.error('npm run test:awin:linkbuilder -- <advertiserId> <destinationUrl> <clickref>');
    process.exit(1);
  }
};

const buildPayload = () => ({
  advertiserId: Number(advertiserId),
  destinationUrl,
  clickRef: clickref
});

const main = async () => {
  printHeader();
  validateEnv();

  const payload = buildPayload();

  try {
    const response = await axios.post(endpoint, payload, {
      headers: {
        Authorization: `Bearer ${apiToken}`,
        Accept: 'application/json',
        'Content-Type': 'application/json'
      },
      timeout: 15000
    });

    console.log(`Status da resposta: ${response.status}`);
    console.log('Primeiro resultado:');
    console.log(JSON.stringify(response.data, null, 2));
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
