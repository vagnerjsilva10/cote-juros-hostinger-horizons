import 'dotenv/config';
import { createApp } from './app.js';

const app = createApp();
const port = Number(process.env.PORT || 4100);

app.listen(port, () => {
  console.log(`Cote Juros API running on port ${port}`);
});
