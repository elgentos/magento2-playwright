const { execSync } = require('child_process');
const readline = require('readline');
const { ENV_FILE, getCurrentValue, updateEnvFile } = require('../helpers/env');

async function askQuestion(rl, query) {
  return new Promise((resolve) => rl.question(query, resolve));
}

async function setup() {
  const currentUser = execSync('whoami').toString().trim();

  const prompts = [
    { key: 'PLAYWRIGHT_BASE_URL', label: 'Base URL', default: 'https://hyva-demo.elgentos.io/' },
    { key: 'MAGENTO_ADMIN_USERNAME', label: 'Magento admin username', default: currentUser },
    { key: 'MAGENTO_ADMIN_PASSWORD', label: 'Magento admin password', default: 'Test1234!' },
  ];

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  const updates = {};

  console.log('\nConfigure your Magento 2 Playwright environment\n');

  for (const prompt of prompts) {
    const currentValue = getCurrentValue(prompt.key) || prompt.default;
    const answer = await askQuestion(rl, `${prompt.label} (${currentValue}): `);
    updates[prompt.key] = answer.trim() || currentValue;
  }

  updateEnvFile(updates);
  console.log(`\nEnvironment saved to ${ENV_FILE}`);

  rl.close();
}

module.exports = setup;
