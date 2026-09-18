export class CheckoutPage {
  constructor(page) {
    this.page = page;

    // Step One - Your Information
    this.firstNameInput = page.locator('[data-test="firstName"]');
    this.lastNameInput = page.locator('[data-test="lastName"]');
    this.postalCodeInput = page.locator('[data-test="postalCode"]');
    this.continueButton = page.locator('[data-test="continue"]');
    this.cancelButton = page.locator('[data-test="cancel"]');
    this.errorMessage = page.locator('[data-test="error"]');

    // Step Two - Overview
    this.finishButton = page.locator('[data-test="finish"]');
    this.totalLabel = page.locator('[data-test="total-label"]');
    this.subtotalLabel = page.locator('[data-test="subtotal-label"]');
    this.taxLabel = page.locator('[data-test="tax-label"]');

    // Complete page
    this.completeHeader = page.locator('[data-test="complete-header"]');
    this.backHomeButton = page.locator('[data-test="back-to-products"]');
    this.generatePdfButton = page.locator('[data-test="generate-pdf-order"]');
  }

  async fillInformation(firstName, lastName, postalCode) {
    await this.firstNameInput.fill(firstName);
    await this.lastNameInput.fill(lastName);
    await this.postalCodeInput.fill(postalCode);
  }

  async continueToOverview() {
    await this.continueButton.click();
  }

  async finishOrder() {
    await this.finishButton.click();
  }

  async cancel() {
    await this.cancelButton.click();
  }

  async backToProducts() {
    await this.backHomeButton.click();
  }
}