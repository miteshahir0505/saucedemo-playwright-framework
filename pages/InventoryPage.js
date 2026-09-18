export class InventoryPage {
  constructor(page) {
    this.page = page;

    this.productsTitle = page.getByText('Products');
    this.cartIcon = page.locator('[data-test="shopping-cart-link"]');
    this.cartBadge = page.locator('[data-test="shopping-cart-badge"]');
  }

  // Add-to-cart and Remove buttons follow a predictable pattern:
  // [data-test="add-to-cart-<product-slug>"]
  // [data-test="remove-<product-slug>"]
  // so instead of hardcoding one locator per product, we build it dynamically
  addToCartButton(productSlug) {
    return this.page.locator(`[data-test="add-to-cart-${productSlug}"]`);
  }

  removeFromCartButton(productSlug) {
    return this.page.locator(`[data-test="remove-${productSlug}"]`);
  }

  async addProductToCart(productSlug) {
    await this.addToCartButton(productSlug).click();
  }

  async removeProductFromCart(productSlug) {
    await this.removeFromCartButton(productSlug).click();
  }

  async getCartCount() {
    const isVisible = await this.cartBadge.isVisible();
    if (!isVisible) return 0;
    return Number(await this.cartBadge.textContent());
  }

  async goToCart() {
    await this.cartIcon.click();
  }
}