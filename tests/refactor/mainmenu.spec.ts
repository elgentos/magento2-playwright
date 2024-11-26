import {test} from '@playwright/test';
import {LoginPage} from './fixtures/login.page';
import {MainMenuPage} from './fixtures/mainmenu.page';

// no resetting storageState, mainmenu has more functionalities when logged in.

// TODO: remove this beforeEach() once authentication as project set-up/fixture works.
// Before each test, log in
test.beforeEach(async ({ page }) => {
  const loginPage = new LoginPage(page);
  await loginPage.login();
});

/**
 * @feature Logout
 * @scenario The user can log out
 *  @given I am logged in
 *  @and I am on any Magento 2 page
 *    @when I open the account menu
 *    @and I click the Logout option
 *  @then I should see a message confirming I am logged out
 */
test('User can log out', { tag: '@mainmenu', }, async ({page}) => {
  const mainMenu = new MainMenuPage(page);
  await mainMenu.logout();
});


test('Navigate to account page', { tag: '@mainmenu', }, async ({page}) => {
  const mainMenu = new MainMenuPage(page);
  await mainMenu.gotoMyAccount();
});