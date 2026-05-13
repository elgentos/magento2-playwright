const { execSync } = require('child_process');
const readline = require('readline');
const { ENV_FILE, getCurrentValue, updateEnvFile } = require('../helpers/env');

/**
 * Prompts the user with a question and returns their answer.
 * @param {readline.Interface} rl - The readline interface to use for input.
 * @param {string} query - The question to display to the user.
 * @returns {Promise<string>} The user's answer.
 */
async function askQuestion(rl, query) {
  return new Promise((resolve) => rl.question(query, resolve));
}

/**
 * Runs an interactive setup wizard that configures the Playwright .env file.
 *
 * Prompts the user for the base URL, Magento admin username, and admin password.
 * For each value, the current .env value (or a default) is shown; pressing Enter
 * keeps the existing value. Results are written to the .env file.
 * @returns {Promise<void>}
 */
async function setup() {
  /** @type {string} The current OS username, used as the default admin username. */
  const currentUser = execSync('whoami').toString().trim();

  /**
   * @type {Array<{key: string, label: string, default: string}>}
   * Each entry defines an env variable to configure:
   * - key: The .env variable name.
   * - label: The human-readable prompt shown to the user.
   * - default: The fallback value when no existing value is set.
   */
  const prompts = [
    { key: 'PLAYWRIGHT_BASE_URL', label: 'Base URL', default: 'https://hyva-demo.elgentos.io/' },
    { key: 'MAGENTO_ADMIN_USERNAME', label: 'Magento admin username', default: currentUser },
    { key: 'MAGENTO_ADMIN_PASSWORD', label: 'Magento admin password', default: 'Test1234!' },
  ];

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  /** @type {Object<string, string>} Accumulated key/value pairs to write to the .env file. */
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
