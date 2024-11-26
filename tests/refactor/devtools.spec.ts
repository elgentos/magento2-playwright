import {test as base, expect} from '@playwright/test';
import {LoginPage} from './fixtures/login.page';

import slugs from './config/slugs.json';
import expectations from './config/expected/expected.json';

// Login from login.page.ts test
base('Login with existing account', async ({page}) => {
  const account = new LoginPage(page);
  await account.login();
});