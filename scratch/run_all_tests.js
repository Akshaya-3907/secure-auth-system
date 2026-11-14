require('dotenv').config();
const { startServer } = require('../backend/server');

async function main() {
  console.log('Booting test environment...');
  await startServer();
  // Wait 1 second for port 5000 to be open and listen
  setTimeout(async () => {
    try {
      require('./test_system.js');
    } catch (e) {
      console.error(e);
      process.exit(1);
    }
  }, 1000);
}

main().catch((err) => {
  console.error('Boot error:', err);
  process.exit(1);
});
