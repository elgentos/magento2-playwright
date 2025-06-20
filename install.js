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

async function main() {
  try {
    // Get Magento 2 project path
    const projectPath = await question('Please enter the path to your Magento 2 project (relative or absolute): ');
    const magentoPath = path.resolve(projectPath);

    if (!fs.existsSync(magentoPath)) {
      console.error(`Directory ${magentoPath} does not exist!`);
      process.exit(1);
    }

    // Handle package.json separately
    const sourcePackageJsonPath = path.resolve(__dirname, 'package.json');
    const targetPackageJsonPath = path.join(magentoPath, 'package.json');

    let finalPackageJson;
    const sourcePackageJson = JSON.parse(fs.readFileSync(sourcePackageJsonPath, 'utf8'));

    if (fs.existsSync(targetPackageJsonPath)) {
      console.log('Existing package.json found, merging dependencies...');
      const targetPackageJson = JSON.parse(fs.readFileSync(targetPackageJsonPath, 'utf8'));

      // Merge dependencies and devDependencies
      finalPackageJson = {
        ...targetPackageJson,
        dependencies: {
          ...(targetPackageJson.dependencies || {}),
          ...(sourcePackageJson.dependencies || {})
        },
        devDependencies: {
          ...(targetPackageJson.devDependencies || {}),
          ...(sourcePackageJson.devDependencies || {})
        }
      };

      // Write merged package.json
      fs.writeFileSync(targetPackageJsonPath, JSON.stringify(finalPackageJson, null, 2));
      console.log('Successfully merged package.json files');
    } else {
      // If no existing package.json, just copy the source one
      fs.copyFileSync(sourcePackageJsonPath, targetPackageJsonPath);
    }

    // Copy remaining files
    const filesToCopy = [
      { src: 'tests', dest: 'tests' },
      { src: '.env.example', dest: '.env' },
      { src: 'bypass-captcha.config.example.ts', dest: 'bypass-captcha.config.ts' },
      { src: 'playwright.config.example.ts', dest: 'playwright.config.ts' }
    ];

    for (const file of filesToCopy) {
      const srcPath = path.resolve(__dirname, file.src);
      const destPath = path.join(magentoPath, file.dest);

      if (file.src === 'tests') {
        if (fs.existsSync(srcPath)) {
          execSync(`cp -R "${srcPath}" "${destPath}"`);
        }
      } else {
        if (fs.existsSync(srcPath)) {
          fs.copyFileSync(srcPath, destPath);
        }
      }
    }

    // Update playwright config
    const playwrightConfigPath = path.join(magentoPath, 'playwright.config.ts');
    if (fs.existsSync(playwrightConfigPath)) {
      let playwrightConfig = fs.readFileSync(playwrightConfigPath, 'utf8');
      playwrightConfig = playwrightConfig.replace(
        'bypass-captcha.config.example.ts',
        'bypass-captcha.config.ts'
      );
      fs.writeFileSync(playwrightConfigPath, playwrightConfig);
    }

    // Get current user
    const currentUser = execSync('whoami').toString().trim();

    // Environment variables with defaults
    const envVars = {
      'MAGENTO_ADMIN_SLUG': { default: 'admin' },
      'MAGENTO_ADMIN_USERNAME': { default: currentUser },
      'MAGENTO_ADMIN_PASSWORD': { default: currentUser + '123' },
      'MAGENTO_NEW_ACCOUNT_PASSWORD': { default: 'Test1234!' },
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
    const envPath = path.join(magentoPath, '.env');
    let envContent = '';

    for (const [key, value] of Object.entries(envVars)) {
      const userInput = await question(`Enter ${key} (default: ${value.default}): `);
      envContent += `${key}=${userInput || value.default}\n`;
    }

    fs.writeFileSync(envPath, envContent);

    console.log('\nInstallation completed successfully!');
    console.log('\nFor more information, please visit:');
    console.log('https://wiki.elgentos.nl/doc/stappenplan-testing-suite-implementeren-voor-klanten-hCGe4hVQvN');

    rl.close();
  } catch (error) {
    console.error('An error occurred:', error);
    rl.close();
    process.exit(1);
  }
}

main();