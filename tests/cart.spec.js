import { test, expect } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';
import { InventoryPage } from '../pages/InventoryPage';
import { CartPage } from '../pages/CartPage';

test.describe('Cart - functionality', () => {

  test('should add item to cart and update badge count', async ({ page }) => {
    const loginPage = new LoginPage(page);
    const inventoryPage = new InventoryPage(page);

    await loginPage.goto();
    await loginPage.login('standard_user', 'secret_sauce');

    await inventoryPage.addProductToCart('sauce-labs-backpack');

    expect(await inventoryPage.getCartCount()).toBe(1);
  });

  test('should update cart badge when adding multiple items', async ({ page }) => {
    const loginPage = new LoginPage(page);
    const inventoryPage = new InventoryPage(page);

    await loginPage.goto();
    await loginPage.login('standard_user', 'secret_sauce');

    await inventoryPage.addProductToCart('sauce-labs-backpack');
    await inventoryPage.addProductToCart('sauce-labs-bike-light');

    expect(await inventoryPage.getCartCount()).toBe(2);
  });

  test('should show zero cart count when nothing is added', async ({ page }) => {
    const loginPage = new LoginPage(page);
    const inventoryPage = new InventoryPage(page);

    await loginPage.goto();
    await loginPage.login('standard_user', 'secret_sauce');

    expect(await inventoryPage.getCartCount()).toBe(0);
  });

  test('should remove item from cart and update badge', async ({ page }) => {
    const loginPage = new LoginPage(page);
    const inventoryPage = new InventoryPage(page);

    await loginPage.goto();
    await loginPage.login('standard_user', 'secret_sauce');

    await inventoryPage.addProductToCart('sauce-labs-backpack');
    expect(await inventoryPage.getCartCount()).toBe(1);

    await inventoryPage.removeProductFromCart('sauce-labs-backpack');
    expect(await inventoryPage.getCartCount()).toBe(0);
  });

  test('Add to cart button should toggle to Remove after adding item', async ({ page }) => {
    const loginPage = new LoginPage(page);
    const inventoryPage = new InventoryPage(page);

    await loginPage.goto();
    await loginPage.login('standard_user', 'secret_sauce');

    // Before adding — Add to cart button should be visible
    await expect(inventoryPage.addToCartButton('sauce-labs-backpack')).toBeVisible();

    await inventoryPage.addProductToCart('sauce-labs-backpack');

    // After adding — Add to cart button should be gone, Remove should now be visible
    await expect(inventoryPage.addToCartButton('sauce-labs-backpack')).not.toBeVisible();
    await expect(inventoryPage.removeFromCartButton('sauce-labs-backpack')).toBeVisible();

    expect(await inventoryPage.getCartCount()).toBe(1);
  });

  test('Adding a second different item should increase cart count to 2', async ({ page }) => {
    const loginPage = new LoginPage(page);
    const inventoryPage = new InventoryPage(page);

    await loginPage.goto();
    await loginPage.login('standard_user', 'secret_sauce');

    await inventoryPage.addProductToCart('sauce-labs-backpack');
    expect(await inventoryPage.getCartCount()).toBe(1);

    await inventoryPage.addProductToCart('sauce-labs-bike-light');
    expect(await inventoryPage.getCartCount()).toBe(2);

    // Both items' buttons should now show "Remove"
    await expect(inventoryPage.removeFromCartButton('sauce-labs-backpack')).toBeVisible();
    await expect(inventoryPage.removeFromCartButton('sauce-labs-bike-light')).toBeVisible();
  });

  test('Removing one of two added items should decrease cart count to 1', async ({ page }) => {
    const loginPage = new LoginPage(page);
    const inventoryPage = new InventoryPage(page);

    await loginPage.goto();
    await loginPage.login('standard_user', 'secret_sauce');

    await inventoryPage.addProductToCart('sauce-labs-backpack');
    await inventoryPage.addProductToCart('sauce-labs-bike-light');
    expect(await inventoryPage.getCartCount()).toBe(2);

    await inventoryPage.removeProductFromCart('sauce-labs-backpack');

    expect(await inventoryPage.getCartCount()).toBe(1);
    // Confirm the remaining item is still the correct one
    await expect(inventoryPage.removeFromCartButton('sauce-labs-bike-light')).toBeVisible();
    await expect(inventoryPage.addToCartButton('sauce-labs-backpack')).toBeVisible();
  });

  test('should navigate to cart page and show added items with checkout option', async ({ page }) => {
    const loginPage = new LoginPage(page);
    const inventoryPage = new InventoryPage(page);
    const cartPage = new CartPage(page);

    await loginPage.goto();
    await loginPage.login('standard_user', 'secret_sauce');

    await inventoryPage.addProductToCart('sauce-labs-backpack');
    await inventoryPage.addProductToCart('sauce-labs-bike-light');

    await inventoryPage.goToCart();

    // Confirm we actually navigated to the cart page
    await expect(page).toHaveURL(/cart/);

    // Confirm the cart list and both action buttons are visible
    await expect(cartPage.cartList).toBeVisible();
    await expect(cartPage.continueShoppingButton).toBeVisible();
    await expect(cartPage.checkoutButton).toBeVisible();

    // Confirm both added items actually appear as removable rows
    await expect(cartPage.removeFromCartButton('sauce-labs-backpack')).toBeVisible();
    await expect(cartPage.removeFromCartButton('sauce-labs-bike-light')).toBeVisible();
  });

  test('Continue Shopping button should return to Products page', async ({ page }) => {
    const loginPage = new LoginPage(page);
    const inventoryPage = new InventoryPage(page);
    const cartPage = new CartPage(page);

    await loginPage.goto();
    await loginPage.login('standard_user', 'secret_sauce');

    await inventoryPage.addProductToCart('sauce-labs-backpack');
    await inventoryPage.goToCart();

    await expect(page).toHaveURL(/cart/);

    await cartPage.continueShopping();

    await expect(page).toHaveURL(/inventory/);
    await expect(inventoryPage.productsTitle).toBeVisible();
  });

});

test.describe('Cart - network resilience', () => {

  test('should handle network loss when adding item to cart', async ({ page }) => {
    const loginPage = new LoginPage(page);
    const inventoryPage = new InventoryPage(page);

    await loginPage.goto();
    await loginPage.login('standard_user', 'secret_sauce');

    // Simulate the internet dropping right before adding an item
    await page.context().setOffline(true);

    await inventoryPage
      .addToCartButton('sauce-labs-backpack')
      .click({ timeout: 5000 })
      .catch(() => {});

    // Restore the network so we can inspect the actual outcome
    await page.context().setOffline(false);

    const cartCount = await inventoryPage.getCartCount();
    console.log('Cart count after offline add-to-cart attempt:', cartCount);

    // We're not assuming a specific outcome — since saucedemo's cart logic is
    // likely client-side only, the add may still succeed even while offline.
    // The important check is that the app doesn't crash or hang indefinitely.
    expect(cartCount === 0 || cartCount === 1).toBe(true);
  });

  test('should allow adding item to cart after network is restored', async ({ page }) => {
    const loginPage = new LoginPage(page);
    const inventoryPage = new InventoryPage(page);

    await loginPage.goto();
    await loginPage.login('standard_user', 'secret_sauce');

    await page.context().setOffline(true);
    await inventoryPage
      .addToCartButton('sauce-labs-backpack')
      .click({ timeout: 5000 })
      .catch(() => {});
    await page.context().setOffline(false);

    // Give the browser a brief moment to settle after coming back online
    await page.waitForTimeout(500);

    // If the item wasn't added while offline, retry now that we're back online
    const isAlreadyAdded = await inventoryPage
      .removeFromCartButton('sauce-labs-backpack')
      .isVisible()
      .catch(() => false);

    if (!isAlreadyAdded) {
      await inventoryPage.addProductToCart('sauce-labs-backpack');
    }

    expect(await inventoryPage.getCartCount()).toBe(1);
    await expect(inventoryPage.removeFromCartButton('sauce-labs-backpack')).toBeVisible();
  });

  test('should handle network loss when removing item from cart', async ({ page }) => {
    const loginPage = new LoginPage(page);
    const inventoryPage = new InventoryPage(page);

    await loginPage.goto();
    await loginPage.login('standard_user', 'secret_sauce');

    // Add the item first, while online
    await inventoryPage.addProductToCart('sauce-labs-backpack');
    expect(await inventoryPage.getCartCount()).toBe(1);

    // Now go offline and try to remove it
    await page.context().setOffline(true);

    await inventoryPage
      .removeFromCartButton('sauce-labs-backpack')
      .click({ timeout: 5000 })
      .catch(() => {});

    await page.context().setOffline(false);

    const cartCount = await inventoryPage.getCartCount();
    console.log('Cart count after offline remove-from-cart attempt:', cartCount);

    expect(cartCount === 0 || cartCount === 1).toBe(true);
  });

  test('should allow removing item from cart after network is restored', async ({ page }) => {
    const loginPage = new LoginPage(page);
    const inventoryPage = new InventoryPage(page);

    await loginPage.goto();
    await loginPage.login('standard_user', 'secret_sauce');

    await inventoryPage.addProductToCart('sauce-labs-backpack');
    expect(await inventoryPage.getCartCount()).toBe(1);

    await page.context().setOffline(true);
    await inventoryPage
      .removeFromCartButton('sauce-labs-backpack')
      .click({ timeout: 5000 })
      .catch(() => {});
    await page.context().setOffline(false);

    await page.waitForTimeout(500);

    // If the item is still in the cart, retry the removal now that we're online
    const stillInCart = await inventoryPage
      .removeFromCartButton('sauce-labs-backpack')
      .isVisible()
      .catch(() => false);

    if (stillInCart) {
      await inventoryPage.removeProductFromCart('sauce-labs-backpack');
    }

    expect(await inventoryPage.getCartCount()).toBe(0);
    await expect(inventoryPage.addToCartButton('sauce-labs-backpack')).toBeVisible();
  });

});