#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const readline = require('readline');
const { execSync } = require('child_process');

class Install {

  rl = '';
  currentUser = '';
  isCi = false;
  useDefaults = false;
  pathToMagentoRoot = '../../../../../../../../../../'; // default: when installed via npm

  envVars = {
    'PLAYWRIGHT_BASE_URL': { default: 'https://hyva-demo.elgentos.io/' },
    'PLAYWRIGHT_PRODUCTION_URL': { default: 'https://hyva-demo.elgentos.io/' },
    'PLAYWRIGHT_REVIEW_URL': { default: 'https://hyva-demo.elgentos.io/' },

    'MAGENTO_ADMIN_SLUG': { default: 'admin' },
    'MAGENTO_ADMIN_USERNAME': { default: this.currentUser },
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
  }

  rulesToAddToIgnore = [
    '# playwright',
    '/app/design/frontend/Elgentos/default/web/playwright/*',
    '!/app/design/frontend/Elgentos/default/web/playwright/tests/',
    '!/app/design/frontend/Elgentos/default/web/playwright/package.json',
    '!/app/design/frontend/Elgentos/default/web/playwright/package-lock.json'
  ]

  constructor() {
    this.useDefaults = true
    this.isCi = process.env.CI === 'true';
    this.currentUser = execSync('whoami').toString().trim();
    const isLocalDev = fs.existsSync(path.resolve(__dirname, '.git'));

    if (isLocalDev) {
      this.pathToMagentoRoot = './'; // we're in the root of the dev repo
    }

    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });

    this.init();
  }

  async init() {
    // Check if user
    if (!this.isCi) {
      const initialAnswer = await this.askQuestion('Do you want to customize environment variables? (y/N): ');
      this.useDefaults = initialAnswer.trim().toLowerCase() !== 'y';
    }

    await this.appendToGitIgnore();
    await this.setEnvVariables();
  }

  async askQuestion(query) {
    return new Promise((resolve) => this.rl.question(query, resolve))
  }

  async setEnvVariables() {
    // Read and update .env file
    const envPath = path.join('.env');
    let envContent = '';

    for (const [key, value] of Object.entries(this.envVars)) {
      let userInput = '';
      if (!this.isCi && !this.useDefaults) {
        userInput = await this.askQuestion(`Enter ${ key } (default: ${ value.default }): `);
      }
      envContent += `${ key }=${ userInput || value.default }\n`;
    }

    fs.writeFileSync(envPath, envContent);

    console.log('\nInstallation completed successfully!');
    console.log('\nFor more information, please visit:');
    console.log('https://wiki.elgentos.nl/doc/stappenplan-testing-suite-implementeren-voor-klanten-hCGe4hVQvN');

    this.rl.close();
  }

  async appendToGitIgnore() {
    console.log('Checking .gitignore and adding lines if necessary...');

    const gitignorePath = path.join(this.pathToMagentoRoot, '.gitignore');

    // Read existing content if file exists
    let existingLines = [];
    if (fs.existsSync(gitignorePath)) {
      const content = fs.readFileSync(gitignorePath, 'utf-8');
      existingLines = content.split(/\r?\n/);
    }

    // Append missing lines
    let updated = false;
    for (const line of this.rulesToAddToIgnore) {
      if (!existingLines.includes(line)) {
        existingLines.push(line);
        updated = true;
      }
    }

    // Write back if updated
    if (updated) {
      fs.writeFileSync(gitignorePath, existingLines.join('\n'), 'utf-8');
      console.log('.gitignore updated.');
    } else {
      console.log('.gitignore already contains all required lines.');
    }
  }
}

new Install();