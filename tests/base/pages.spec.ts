import {test} from '@playwright/test';
import slugs from './fixtures/before/slugs.json';
import {PageTester} from './utils/PageTester';

test.describe('Check for page errors', () => {


  /**
   * @feature Homepage Error Tester
   *  @scenario Check homepage for errors
   *    @when I navigate to the Homepage
   *      @and I check it for errors
   *    @then I should not get errors
   */
  test('Check for homepage errors', async ({page}) => {
    const homepageTester = new PageTester(page, slugs.homepageSlug);
    await homepageTester.testPage();
  });

  /**
   * @feature Category Page Error Tester
   *  @scenario Check a category page for errors
   *    @when I navigate to a category page
   *      @and I check it for errors
   *    @then I should not get errors
   */  
  test('Check for category page errors', async ({page}) => {
    const categoryTester = new PageTester(page, slugs.categorySlug);
    await categoryTester.testPage();
  });

  /**
   * @feature Product Page Error Tester
   *  @scenario Check a product page for errors
   *    @when I navigate to a product page
   *      @and I check it for errors
   *    @then I should not get errors
   */  
  test('Check for product page errors', async ({page}) => {
    const productTester = new PageTester(page, slugs.pageSlug);
    await productTester.testPage();
  });

  /**
   * @feature Cart Page Error Tester
   *  @scenario Check the cart page for errors
   *    @when I navigate to the cart page
   *      @and I check it for errors
   *    @then I should not get errors
   */    
  test('Check for cart page errors', async ({page}) => {
    const cartTester = new PageTester(page, slugs.cartSlug);
    await cartTester.testPage();
  });

  /**
   * @feature Search (Results) Page Error Tester
   *  @scenario Check the search (results) page for errors
   *    @when I navigate to the search (results) page
   *      @and I check it for errors
   *    @then I should not get errors
   */  
  test('Check for search page errors', async ({page}) => {
    const searchTester = new PageTester(page, slugs.searchSlug);
    await searchTester.testPage();
  });

    /**
   * @feature Contact Page Error Tester
   *  @scenario Check the contact page for errors
   *    @when I navigate to the contact page
   *      @and I check it for errors
   *    @then I should not get errors
   */  
  test('Check for contact page errors', async ({page}) => {
    const contactTester = new PageTester(page, slugs.contactSlug);
    await contactTester.testPage();
  });

});
