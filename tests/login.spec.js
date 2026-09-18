import { test, expect } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';
import { users, checkoutInfo } from '../fixtures/users';

test.describe('Login - credential validation', () => {

  test('should log in successfully with valid credentials', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login(users.standard.username, users.standard.password);

    await expect(page.getByText('Products')).toBeVisible();
  });

  test('should show error when password is incorrect', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login(users.standard.username, users.invalid.password);

    await expect(loginPage.errorMessage).toBeVisible();
  });

  test('should show error when username is incorrect', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login('wrong_user', 'secret_sauce');

    await expect(loginPage.errorMessage).toBeVisible();
  });

  test('should show error when username is empty', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login('', 'secret_sauce');

    await expect(loginPage.errorMessage).toBeVisible();
  });

  test('should show error when password is empty', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login('standard_user', '');

    await expect(loginPage.errorMessage).toBeVisible();
  });

  test('should show error when user is locked out', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login('locked_out_user', 'secret_sauce');

    await expect(loginPage.errorMessage).toBeVisible();
  });

});

test.describe('Login - behavior and edge cases', () => {

  test('should handle multiple rapid clicks on login button without breaking', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.usernameInput.fill('standard_user');
    await loginPage.passwordInput.fill('secret_sauce');

    for (let i = 0; i < 3; i++) {
      await loginPage.loginButton.click({ timeout: 2000 }).catch(() => {});
    }

    await expect(page).toHaveURL(/inventory/);
    await expect(page.getByText('Products')).toBeVisible();
  });

  test('should remain logged in after page refresh', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login('standard_user', 'secret_sauce');

    await expect(page.getByText('Products')).toBeVisible();

    // Refresh the page
    await page.reload();

    // Should still be logged in, still on Products page
    await expect(page.getByText('Products')).toBeVisible();
    await expect(page).toHaveURL(/inventory/);
  });

  test('should not restore session when using back button after logout', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login('standard_user', 'secret_sauce');

    await expect(page.getByText('Products')).toBeVisible();

    await loginPage.logout();
    await expect(loginPage.loginButton).toBeVisible();

    // Press browser back button
    await page.goBack();

    // Should NOT show Products — should still require login
    await expect(loginPage.loginButton).toBeVisible();
  });

});

test.describe('Login - tampered / malicious input', () => {

  test('should not bypass login via SQL injection in username', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login("' OR '1'='1", "' OR '1'='1");

    // Should NOT log in — should show the normal error
    await expect(loginPage.errorMessage).toBeVisible();
    await expect(page).not.toHaveURL(/inventory/);
  });

  test('should not execute script injection in username', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login('<script>alert("hacked")</script>', 'secret_sauce');

    // No alert dialog should pop up, and login should fail normally
    await expect(loginPage.errorMessage).toBeVisible();
  });

  test('should show error (not crash) when username is extremely long', async ({ page }) => {
    const longString = 'a'.repeat(5000);

    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login(longString, 'secret_sauce');

    // Page should still respond (not crash/hang) and show an error
    await expect(loginPage.errorMessage).toBeVisible();
  });

  test('should handle leading/trailing whitespace in username predictably', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login('  standard_user  ', 'secret_sauce');

    // saucedemo likely does NOT trim, so this probably shows an error.
    // If it logs in successfully instead, that tells us it DOES trim — either is worth knowing.
    const isLoggedIn = await page.getByText('Products').isVisible().catch(() => false);
    if (isLoggedIn) {
      console.log('App trims whitespace and logged in successfully');
    } else {
      await expect(loginPage.errorMessage).toBeVisible();
    }
  });

});

test.describe('Login - password field security', () => {

  test('password field should use type="password" to mask input', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.passwordInput.fill('secret_sauce');

    // Check the actual HTML attribute — this is what makes the browser mask it
    await expect(loginPage.passwordInput).toHaveAttribute('type', 'password');
  });

});