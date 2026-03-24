#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const readline = require('readline');
const { execSync } = require('child_process');

const ENV_FILE = path.join(process.cwd(), '.env');

const BROWSERS = ['CHROMIUM', 'FIREFOX', 'WEBKIT'];
const COUPON_PATTERN = '{browser}321';

// -- Env file helpers --

function getCurrentValue(filePath, key) {
  if (!fs.existsSync(filePath)) return null;

  const lines = fs.readFileSync(filePath, 'utf-8').split(/\r?\n/);
  for (const line of lines) {
    const match = line.match(new RegExp(`^${key}=(.*)$`));
    if (match) return match[1];
  }
  return null;
}

function updateEnvFile(filePath, updates) {
  let lines = [];
  if (fs.existsSync(filePath)) {
    lines = fs.readFileSync(filePath, 'utf-8').split(/\r?\n/);
  }

  const remaining = { ...updates };

  lines = lines.map((line) => {
    for (const key of Object.keys(remaining)) {
      const match = line.match(new RegExp(`^${key}=`));
      if (match) {
        delete remaining[key];
        return `${key}=${updates[key]}`;
      }
    }
    return line;
  });

  for (const [key, value] of Object.entries(remaining)) {
    lines.push(`${key}=${value}`);
  }

  fs.writeFileSync(filePath, lines.join('\n'));
}

function loadEnv() {
  if (!fs.existsSync(ENV_FILE)) return;
  const lines = fs.readFileSync(ENV_FILE, 'utf-8').split(/\r?\n/);
  for (const line of lines) {
    const match = line.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/);
    if (match && !process.env[match[1]]) {
      process.env[match[1]] = match[2];
    }
  }
}

async function askQuestion(rl, query) {
  return new Promise((resolve) => rl.question(query, resolve));
}

// -- API helpers --

async function getAdminToken(baseUrl, username, password, httpCredentials) {
  const fetchOptions = {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  };

  if (httpCredentials) {
    fetchOptions.headers['Authorization'] =
      'Basic ' + Buffer.from(`${httpCredentials.username}:${httpCredentials.password}`).toString('base64');
  }

  const response = await fetch(`${baseUrl}rest/V1/integration/admin/token`, fetchOptions);

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Failed to get admin token: ${response.status} ${body}`);
  }

  return await response.json();
}

async function apiRequest(method, url, token, baseUrl, httpCredentials, payload) {
  const fetchOptions = {
    method,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
  };

  if (httpCredentials) {
    fetchOptions.headers['Authorization'] =
      'Basic ' + Buffer.from(`${httpCredentials.username}:${httpCredentials.password}`).toString('base64');
    fetchOptions.headers['Authorization'] = `Bearer ${token}`;
  }

  if (payload) {
    fetchOptions.body = JSON.stringify(payload);
  }

  const response = await fetch(`${baseUrl}${url}`, fetchOptions);

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`API ${method} ${url} failed: ${response.status} ${body}`);
  }

  return await response.json();
}

// -- Commands --

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
    const currentValue = getCurrentValue(ENV_FILE, prompt.key) || prompt.default;
    const answer = await askQuestion(rl, `${prompt.label} (${currentValue}): `);
    updates[prompt.key] = answer.trim() || currentValue;
  }

  updateEnvFile(ENV_FILE, updates);
  console.log(`\nEnvironment saved to ${ENV_FILE}`);

  rl.close();
}

async function createCoupons() {
  loadEnv();

  const baseUrl = process.env.PLAYWRIGHT_BASE_URL;
  const adminUsername = process.env.MAGENTO_ADMIN_USERNAME;
  const adminPassword = process.env.MAGENTO_ADMIN_PASSWORD;

  if (!baseUrl || !adminUsername || !adminPassword) {
    console.error('Missing required .env variables: PLAYWRIGHT_BASE_URL, MAGENTO_ADMIN_USERNAME, MAGENTO_ADMIN_PASSWORD');
    console.error('Run "magento2-playwright setup" first.');
    process.exit(1);
  }

  const httpUsername = process.env.HTTP_AUTH_USERNAME;
  const httpPassword = process.env.HTTP_AUTH_PASSWORD;
  const httpCredentials = (httpUsername && httpPassword) ? { username: httpUsername, password: httpPassword } : null;

  console.log(`\nConnecting to ${baseUrl}...`);
  const token = await getAdminToken(baseUrl, adminUsername, adminPassword, httpCredentials);
  console.log('Authenticated successfully.\n');

  const api = (method, url, payload) => apiRequest(method, url, token, baseUrl, httpCredentials, payload);

  // Get website IDs and customer group IDs for the sales rule
  const websiteInfo = await api('GET', 'rest/V1/store/websites');
  const customerGroups = await api('GET', 'rest/V1/customerGroups/search?searchCriteria=all');

  const websiteIds = websiteInfo
    .filter((w) => w.name !== 'admin')
    .map((w) => w.id);
  const customerGroupIds = customerGroups.items.map((g) => g.id);

  for (const browser of BROWSERS) {
    const couponCode = COUPON_PATTERN.replace('{browser}', browser);
    console.log(`Processing coupon "${couponCode}"...`);

    // Check if coupon already exists
    const searchResult = await api(
      'GET',
      `rest/V1/coupons/search` +
      `?searchCriteria[filter_groups][0][filters][0][field]=code` +
      `&searchCriteria[filter_groups][0][filters][0][value]=%${couponCode}%` +
      `&searchCriteria[filter_groups][0][filters][0][condition_type]=like`
    );

    const existingCoupon = searchResult.items.find((item) => item.code === couponCode);

    if (existingCoupon) {
      // Coupon exists — ensure its rule is active
      const rule = await api('GET', `rest/V1/salesRules/${existingCoupon.rule_id}`);

      if (!rule.is_active) {
        rule.is_active = true;
        await api('PUT', `rest/V1/salesRules/${existingCoupon.rule_id}`, { rule });
        console.log(`  Activated existing coupon "${couponCode}".`);
      } else {
        console.log(`  Coupon "${couponCode}" already exists and is active.`);
      }
      continue;
    }

    // Create new sales rule + coupon
    const newRule = {
      name: `Test coupon ${browser}`,
      website_ids: websiteIds,
      customer_group_ids: customerGroupIds,
      from_date: new Date().toISOString().split('T')[0],
      uses_per_customer: 0,
      is_active: true,
      stop_rules_processing: true,
      is_advanced: true,
      sort_order: 0,
      discount_amount: 10,
      discount_step: 0,
      apply_to_shipping: false,
      times_used: 0,
      is_rss: true,
      coupon_type: 2,
      use_auto_generation: false,
      uses_per_coupon: 0,
    };

    const createdRule = await api('POST', 'rest/V1/salesRules', { rule: newRule });

    await api('POST', 'rest/V1/coupons', {
      coupon: {
        rule_id: createdRule.rule_id,
        code: couponCode,
        times_used: 0,
        is_primary: true,
      },
    });

    console.log(`  Created coupon "${couponCode}" with 10% discount.`);
  }

  console.log('\nDone! All coupon codes are ready.');
}

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
