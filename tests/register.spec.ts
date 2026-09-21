// @ts-check

import { guestTest as test } from '@utils/fixtures.utils';
import { faker } from '@faker-js/faker';
import { inputValues } from '@config';

import { RegisterPage } from '@poms/frontend/register.page';
import { requireEnv } from '@utils/env.utils';

/**
 * @feature Magento 2 Account Creation
 * @scenario The user creates an account on the website
 *  @given I am on any Magento 2 page
 *    @when I go to the account creation page
 *    @and I fill in the required information correctly
 *  @then I click the 'Create account' button
 *  @then I should see a messsage confirming my account was created
 */
test(
	'User_registers_an_account',
	{ tag: ['@account-creation', '@hot'] },
	async ({ page, browserName }, testInfo) => {
		const registerPage = new RegisterPage(page);
		await registerPage.goToRegisterPage();

		// Retrieve desired password from .env file
		const existingAccountPassword = requireEnv('MAGENTO_EXISTING_ACCOUNT_PASSWORD');
		const firstName = faker.person.firstName();
		const lastName = faker.person.lastName();

		const browserEngine = browserName?.toUpperCase() || 'UNKNOWN';
		const randomNumber = Math.floor(Math.random() * 1000);
		const emailHandle = inputValues.accountCreation.emailHandleValue;
		const emailHost = inputValues.accountCreation.emailHostValue;
		const accountEmail = `${emailHandle}${randomNumber}-${browserEngine}@${emailHost}`;

		if (!accountEmail) {
			throw new Error(`Generated account email is invalid.`);
		}
		// end of browserNameEmailSection

		await registerPage.createNewAccount(
			firstName,
			lastName,
			accountEmail,
			existingAccountPassword,
		);
		testInfo.annotations.push({
			type: 'Notification: account created!',
			description: `Credentials used: ${accountEmail}, password: ${existingAccountPassword}`,
		});
	},
);
