import {test as base} from '@playwright/test';
import {LoginPage} from './fixtures/login.page';
import {MainMenuPage} from './fixtures/mainmenu.page';

// no resetting storageState, mainmenu has more functionalities when logged in.


/**
 * @feature Logout
 * @scenario The user can log out
 *  @given I am logged in
 *  @and I am on any Magento 2 page
 *    @when I open the account menu
 *    @and I click the Logout option
 *  @then I should see a message confirming I am logged out
 */
base('User can log out', async ({page}) => {
  // TODO: remove login once storageState has been implemented.
  // TODO: add if-statement to only log in if we're not logged in yet.
  const loginPage = new LoginPage(page);
  await loginPage.login();
  
  const mainMenu = new MainMenuPage(page);
  await mainMenu.logout();
});