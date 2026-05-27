const { ethers } = require('ethers');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Compilar el contrato con solc
function compilar() {
  try {
    execSync('solc --version', { stdio: 'ignore' });
  } catch {
    console.error('ERROR: solc no instalado. Corre: npm install -g solc');
    process.exit(1);
  }

  const out = execSync(
    `solc --abi --bin --optimize ${path.join(__dirname, 'AuditLog.sol')} -o ${path.join(__dirname, 'build')} --overwrite`,
    { encoding: 'utf8' }
  );
  console.log('Compilado:', out || 'OK');
}

async function deploy() {
  compilar();

  const abi = fs.readFileSync(path.join(__dirname, 'build', 'ParkingAuditLog.abi'), 'utf8');
  const bin = fs.readFileSync(path.join(__dirname, 'build', 'ParkingAuditLog.bin'), 'utf8');

  const provider = new ethers.JsonRpcProvider(process.env.BLOCKCHAIN_RPC_URL);
  const wallet   = new ethers.Wallet(process.env.BLOCKCHAIN_PRIVATE_KEY, provider);

  console.log('Desplegando desde:', wallet.address);

  const factory  = new ethers.ContractFactory(JSON.parse(abi), bin, wallet);
  const contract = await factory.deploy();
  await contract.waitForDeployment();

  const address = await contract.getAddress();
  console.log('\n✅ Contrato desplegado en:', address);
  console.log('\nAgrega esto a .env.local y .env.production:');
  console.log(`BLOCKCHAIN_CONTRACT_ADDRESS="${address}"`);
}

require('dotenv').config({ path: path.join(__dirname, '../webapp/.env.local') });
deploy().catch(console.error);
