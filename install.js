#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const readline = require('readline');
const { execSync } = require('child_process');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const question = (query) => new Promise((resolve) => rl.question(query, resolve));

async function install() {

  // Get current user
  const currentUser = execSync('whoami').toString().trim();

  // Environment variables with defaults
  const envVars = {
    'PLAYWRIGHT_BASE_URL': { default: 'https://hyva-demo.elgentos.io/' },
    'PLAYWRIGHT_PRODUCTION_URL': { default: 'https://hyva-demo.elgentos.io/' },
    'PLAYWRIGHT_REVIEW_URL': { default: 'https://hyva-demo.elgentos.io/' },

    'MAGENTO_ADMIN_SLUG': { default: 'admin' },
    'MAGENTO_ADMIN_USERNAME': { default: currentUser },
    'MAGENTO_ADMIN_PASSWORD': { default: 'Test1234!' },
    'MAGENTO_THEME_LOCALE': { default: 'nl_NL' },

    'MAGENTO_NEW_ACCOUNT_PASSWORD': { default: 'NewTest1234!' },
    'MAGENTO_EXISTING_ACCOUNT_EMAIL_CHROMIUM': { default: 'user-CHROMIUM@elgentos.nl' },
    'MAGENTO_EXISTING_ACCOUNT_EMAIL_FIREFOX': { default: 'user-FIREFOX@elgentos.nl' },
    'MAGENTO_EXISTING_ACCOUNT_EMAIL_WEBKIT': { default: 'user-WEBKIT@elgentos.nl' },
    'MAGENTO_EXISTING_ACCOUNT_PASSWORD': { default: 'Test1234!' },
    'MAGENTO_EXISTING_ACCOUNT_CHANGED_PASSWORD': { default: 'AanpassenKan@0212' },

    'MAGENTO_COUPON_CODE_CHROMIUM': { default: 'CHROMIUM321' },
    'MAGENTO_COUPON_CODE_FIREFOX': { default: 'FIREFOX321' },
    'MAGENTO_COUPON_CODE_WEBKIT': { default: 'WEBKIT321' }
  };

  // Read and update .env file
  const envPath = path.join('.env');
  let envContent = '';

  // for (const [key, value] of Object.entries(envVars)) {
  //   const userInput = await question(`Enter ${ key } (default: ${ value.default }): `);
  //   envContent += `${ key }=${ userInput || value.default }\n`;
  // }

  const isCI = process.env.CI === 'true';
  for (const [key, value] of Object.entries(envVars)) {
    let userInput = '';
    if (!isCI) {
      userInput = await question(`Enter ${ key } (default: ${ value.default }): `);
    }
    envContent += `${ key }=${ userInput || value.default }\n`;
  }

  fs.writeFileSync(envPath, envContent);

  console.log('\nInstallation completed successfully!');
  console.log('\nFor more information, please visit:');
  console.log('https://wiki.elgentos.nl/doc/stappenplan-testing-suite-implementeren-voor-klanten-hCGe4hVQvN');

  rl.close();
}

install();
