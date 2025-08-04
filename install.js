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

  // Add initial question to allow user to simply use defaults
  const isCI = process.env.CI === 'true';
  let useDefaults = true;

  // Check if user
  if (!isCI) {
    const initialAnswer = await question('Do you want to customize environment variables? (y/N): ');
    useDefaults = initialAnswer.trim().toLowerCase() !== 'y';
  }

  // Read and update .env file
  const envPath = path.join('.env');
  let envContent = '';

  for (const [key, value] of Object.entries(envVars)) {
      let userInput = '';
      if (!isCI && !useDefaults) {
          userInput = await question(`Enter ${key} (default: ${value.default}): `);
      }
      envContent += `${key}=${userInput || value.default}\n`;
  }

  fs.writeFileSync(envPath, envContent);

  console.log('\nInstallation completed successfully!');
  console.log('\nFor more information, please visit:');
  console.log('https://wiki.elgentos.nl/doc/stappenplan-testing-suite-implementeren-voor-klanten-hCGe4hVQvN');

  rl.close();
}

async function appendGitIgnore() {
    console.log('Checking .gitignore and adding lines if necessary...');
    // The lines to be added to gitignore
    const requiredLines = [
        '# playwright',
        '/app/design/frontend/{vendor}/{theme}/web/playwright/*',
        '!/app/design/frontend/{vendor}/{theme}/web/playwright/tests/',
        '!/app/design/frontend/{vendor}/{theme}/web/playwright/package.json',
        '!/app/design/frontend/{vendor}/{theme}/web/playwright/package-lock.json',
    ];

    // Get the current file's directory and go 7 levels up
    let gitignorePath = __dirname;
    // for (let i = 0; i < 7; i++) {
    //     gitignorePath = path.dirname(gitignorePath);
    // }

    gitignorePath = path.join(gitignorePath, '.gitignore');

    // Read existing content if file exists
    let existingLines = [];
    if (fs.existsSync(gitignorePath)) {
        const content = fs.readFileSync(gitignorePath, 'utf-8');
        existingLines = content.split(/\r?\n/);
    }

    // Append missing lines
    let updated = false;
    for (const line of requiredLines) {
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


install().then(appendGitIgnore);

