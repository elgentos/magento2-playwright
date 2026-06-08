const { loadEnv, getHttpCredentials } = require('../helpers/env');
const { getAdminToken, apiRequest } = require('../helpers/api');

const BROWSERS = ['CHROMIUM', 'FIREFOX', 'WEBKIT'];
const COUPON_PATTERN = '{browser}321';

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

  const httpCredentials = getHttpCredentials();

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

module.exports = createCoupons;
