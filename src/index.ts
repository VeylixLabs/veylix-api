import dotenv from 'dotenv';
import { createApp } from './app';

dotenv.config();

const PORT = process.env.PORT || 8080;
const app = createApp();

app.listen(PORT, () => {
  console.log(`🚀 VEYLIX API Gateway is running on port ${PORT}`);
  console.log(`🔄 Proxying /v1/* to ${process.env.DAPP_URL || 'https://dapp.veylixlabs.xyz'}/api/*`);
});
