export class CartPage {
  constructor(page) {
    this.page = page;

    this.cartList = page.locator('[data-test="cart-list"]');
    this.continueShoppingButton = page.locator('[data-test="continue-shopping"]');
    this.checkoutButton = page.locator('[data-test="checkout"]');
  }

  // Same dynamic pattern as InventoryPage — the remove button's
  // data-test value is built from the product's slug
  removeFromCartButton(productSlug) {
    return this.page.locator(`[data-test="remove-${productSlug}"]`);
  }

  async removeItem(productSlug) {
    await this.removeFromCartButton(productSlug).click();
  }

  async continueShopping() {
    await this.continueShoppingButton.click();
  }

  async goToCheckout() {
    await this.checkoutButton.click();
  }
}