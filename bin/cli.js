#!/usr/bin/env node

const setup = require('./commands/setup');
const createCoupons = require('./commands/create-coupons');

function showHelp() {
  console.log(`
Usage: magento2-playwright <command>

Commands:
  setup           Configure .env with base URL and admin credentials
  create-coupons  Create coupon codes in Magento for each browser engine
  help            Show this help message
`);
}

// -- Main --

const command = process.argv[2];

switch (command) {
  case 'setup':
    setup();
    break;
  case 'create-coupons':
    createCoupons().catch((err) => {
      console.error(`\nError: ${err.message}`);
      process.exit(1);
    });
    break;
  case 'help':
  case '--help':
  case '-h':
  case undefined:
    showHelp();
    break;
  default:
    console.error(`Unknown command: ${command}`);
    showHelp();
    process.exit(1);
}
