import '@nomicfoundation/hardhat-toolbox';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: join(__dirname, '../webapp/.env.local') });

export default {
  solidity: '0.8.20',
  networks: {
    hardhat: {},
    amoy: {
      url: process.env.BLOCKCHAIN_RPC_URL || '',
      accounts: process.env.BLOCKCHAIN_PRIVATE_KEY ? [process.env.BLOCKCHAIN_PRIVATE_KEY] : [],
    },
  },
};
