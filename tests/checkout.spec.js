import { test, expect } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';
import { InventoryPage } from '../pages/InventoryPage';
import { CartPage } from '../pages/CartPage';
import { CheckoutPage } from '../pages/CheckoutPage';

test.describe('Checkout - core flow', () => {

  test('should complete full checkout flow successfully', async ({ page }) => {
    const loginPage = new LoginPage(page);
    const inventoryPage = new InventoryPage(page);
    const cartPage = new CartPage(page);
    const checkoutPage = new CheckoutPage(page);

    await loginPage.goto();
    await loginPage.login('standard_user', 'secret_sauce');

    await inventoryPage.addProductToCart('sauce-labs-backpack');
    await inventoryPage.goToCart();

    await cartPage.goToCheckout();
    await expect(page).toHaveURL(/checkout-step-one/);

    await checkoutPage.fillInformation('Alex', 'Simmons', '34355');
    await checkoutPage.continueToOverview();

    await expect(page).toHaveURL(/checkout-step-two/);
    await expect(checkoutPage.totalLabel).toBeVisible();

    await checkoutPage.finishOrder();

    await expect(page).toHaveURL(/checkout-complete/);
    await expect(checkoutPage.completeHeader).toBeVisible();
  });

  test('should show error when first name is missing at checkout', async ({ page }) => {
    const loginPage = new LoginPage(page);
    const inventoryPage = new InventoryPage(page);
    const cartPage = new CartPage(page);
    const checkoutPage = new CheckoutPage(page);

    await loginPage.goto();
    await loginPage.login('standard_user', 'secret_sauce');

    await inventoryPage.addProductToCart('sauce-labs-backpack');
    await inventoryPage.goToCart();
    await cartPage.goToCheckout();

    // Leave first name empty
    await checkoutPage.lastNameInput.fill('Simmons');
    await checkoutPage.postalCodeInput.fill('34355');
    await checkoutPage.continueToOverview();

    await expect(checkoutPage.errorMessage).toBeVisible();
    await expect(checkoutPage.errorMessage).toHaveText('Error: First Name is required');
  });

  test('should return to cart when cancel is clicked on checkout info page', async ({ page }) => {
    const loginPage = new LoginPage(page);
    const inventoryPage = new InventoryPage(page);
    const cartPage = new CartPage(page);
    const checkoutPage = new CheckoutPage(page);

    await loginPage.goto();
    await loginPage.login('standard_user', 'secret_sauce');

    await inventoryPage.addProductToCart('sauce-labs-backpack');
    await inventoryPage.goToCart();
    await cartPage.goToCheckout();

    await checkoutPage.cancel();

    await expect(page).toHaveURL(/cart/);
  });

  test('should trigger a PDF download when Generate PDF order is clicked', async ({ page }) => {
    const loginPage = new LoginPage(page);
    const inventoryPage = new InventoryPage(page);
    const cartPage = new CartPage(page);
    const checkoutPage = new CheckoutPage(page);

    await loginPage.goto();
    await loginPage.login('standard_user', 'secret_sauce');

    await inventoryPage.addProductToCart('sauce-labs-backpack');
    await inventoryPage.goToCart();
    await cartPage.goToCheckout();

    await checkoutPage.fillInformation('Alex', 'Simmons', '34355');
    await checkoutPage.continueToOverview();
    await checkoutPage.finishOrder();

    await expect(page).toHaveURL(/checkout-complete/);

    // Start waiting for the download BEFORE clicking, then click, then await the download
    const downloadPromise = page.waitForEvent('download');
    await checkoutPage.generatePdfButton.click();
    const download = await downloadPromise;

    // Confirm a real file was offered for download
    expect(download.suggestedFilename()).toContain('.pdf');
  });

});

test.describe('Checkout - network resilience', () => {

  test('should handle network loss when submitting checkout information', async ({ page }) => {
    const loginPage = new LoginPage(page);
    const inventoryPage = new InventoryPage(page);
    const cartPage = new CartPage(page);
    const checkoutPage = new CheckoutPage(page);

    await loginPage.goto();
    await loginPage.login('standard_user', 'secret_sauce');

    await inventoryPage.addProductToCart('sauce-labs-backpack');
    await inventoryPage.goToCart();
    await cartPage.goToCheckout();

    await checkoutPage.fillInformation('Alex', 'Simmons', '34355');

    // Simulate the internet dropping right before submitting
    await page.context().setOffline(true);

    // Try to continue — this may hang, fail, or behave unexpectedly since
    // there's no internet. We give it a short timeout so the test doesn't
    // wait the full default 30s if it's simply stuck.
    await checkoutPage.continueButton.click({ timeout: 5000 }).catch(() => {});

    // Restore the network so we can inspect the actual outcome
    await page.context().setOffline(false);

    // We genuinely don't know which of these will be true — that's the point
    // of this test. Log the outcome so we can see saucedemo's real behavior.
    const isOnStepTwo = page.url().includes('checkout-step-two');
    const isStillOnStepOne = page.url().includes('checkout-step-one');

    console.log('URL after offline continue attempt:', page.url());
    expect(isOnStepTwo || isStillOnStepOne).toBe(true); // at minimum, it shouldn't crash to a blank/error page
  });

  test('should allow checkout to proceed after network is restored', async ({ page }) => {
    const loginPage = new LoginPage(page);
    const inventoryPage = new InventoryPage(page);
    const cartPage = new CartPage(page);
    const checkoutPage = new CheckoutPage(page);

    await loginPage.goto();
    await loginPage.login('standard_user', 'secret_sauce');

    await inventoryPage.addProductToCart('sauce-labs-backpack');
    await inventoryPage.goToCart();
    await cartPage.goToCheckout();

    await checkoutPage.fillInformation('Alex', 'Simmons', '34355');

    await page.context().setOffline(true);
    await checkoutPage.continueButton.click({ timeout: 5000 }).catch(() => {});
    await page.context().setOffline(false);

    // Give the browser a brief moment to settle after coming back online
    await page.waitForTimeout(500);

    // Retry if still on step one
    if (page.url().includes('checkout-step-one')) {
      await checkoutPage.continueButton.click();
    }

    await expect(page).toHaveURL(/checkout-step-two/, { timeout: 10000 });
    await expect(checkoutPage.totalLabel).toBeVisible();
  });

  test('should handle network loss when generating PDF order', async ({ page }) => {
    const loginPage = new LoginPage(page);
    const inventoryPage = new InventoryPage(page);
    const cartPage = new CartPage(page);
    const checkoutPage = new CheckoutPage(page);

    await loginPage.goto();
    await loginPage.login('standard_user', 'secret_sauce');

    await inventoryPage.addProductToCart('sauce-labs-backpack');
    await inventoryPage.goToCart();
    await cartPage.goToCheckout();

    await checkoutPage.fillInformation('Alex', 'Simmons', '34355');
    await checkoutPage.continueToOverview();
    await checkoutPage.finishOrder();

    await expect(page).toHaveURL(/checkout-complete/);

    // Go offline right before generating the PDF
    await page.context().setOffline(true);

    // Attempt to trigger the download while offline — this may fail to produce
    // a download event at all, so we race it against a timeout instead of
    // assuming the download will definitely fire
    let downloadHappened = false;
    try {
      const downloadPromise = page.waitForEvent('download', { timeout: 5000 });
      await checkoutPage.generatePdfButton.click();
      await downloadPromise;
      downloadHappened = true;
    } catch {
      downloadHappened = false;
    }

    await page.context().setOffline(false);

    console.log('Did PDF download succeed while offline?', downloadHappened);

    // We're not asserting a specific outcome here since we don't know it in
    // advance — the goal is to observe and confirm the app doesn't crash
    await expect(checkoutPage.completeHeader).toBeVisible();
  });

  test('should allow PDF generation to succeed after network is restored', async ({ page }) => {
    const loginPage = new LoginPage(page);
    const inventoryPage = new InventoryPage(page);
    const cartPage = new CartPage(page);
    const checkoutPage = new CheckoutPage(page);

    await loginPage.goto();
    await loginPage.login('standard_user', 'secret_sauce');

    await inventoryPage.addProductToCart('sauce-labs-backpack');
    await inventoryPage.goToCart();
    await cartPage.goToCheckout();

    await checkoutPage.fillInformation('Alex', 'Simmons', '34355');
    await checkoutPage.continueToOverview();
    await checkoutPage.finishOrder();

    await expect(page).toHaveURL(/checkout-complete/);

    // Simulate a brief offline period, then restore before attempting download
    await page.context().setOffline(true);
    await page.waitForTimeout(500);
    await page.context().setOffline(false);
    await page.waitForTimeout(500);

    // Now attempt the actual download — this should succeed normally
    const downloadPromise = page.waitForEvent('download');
    await checkoutPage.generatePdfButton.click();
    const download = await downloadPromise;

    expect(download.suggestedFilename()).toContain('.pdf');
  });

});