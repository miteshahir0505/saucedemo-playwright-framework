[![Playwright Tests](https://github.com/miteshahir0505/saucedemo-playwright-framework/actions/workflows/playwright.yml/badge.svg)](https://github.com/miteshahir0505/saucedemo-playwright-framework/actions/workflows/playwright.yml)

# SauceDemo Test Automation Framework

An end-to-end test automation framework built with **Playwright** and **JavaScript**, covering the full user journey on [saucedemo.com](https://www.saucedemo.com) — login, product browsing, cart management, and checkout — using the **Page Object Model (POM)** design pattern.

## What this project demonstrates

- **Page Object Model architecture** — UI interactions (`LoginPage`, `InventoryPage`, `CartPage`, `CheckoutPage`) are fully separated from test logic, so a UI change only requires updating one file, not every test.
- **Comprehensive test coverage** — 30+ tests across credential validation, security (SQL/script injection), session behavior, cart operations, and multi-step checkout.
- **Network resilience testing** — simulated offline/online conditions during checkout and cart actions using Playwright's network interception, to observe how the application behaves under real-world connectivity issues.
- **Environment-based configuration** — `baseURL` is driven by a `.env` file rather than hardcoded, so the same suite can target different environments without code changes.
- **Organized, readable test suites** — tests are grouped with `test.describe` into logical categories (e.g. *Login - credential validation*, *Checkout - network resilience*) for clear reporting.

## Tech stack

- [Playwright](https://playwright.dev/) — browser automation and test runner
- JavaScript (ES Modules)
- Page Object Model design pattern
- `dotenv` for environment configuration
- Cross-browser: Chromium, Firefox, WebKit

## Project structure

```
├── pages/                  # Page Object classes
│   ├── LoginPage.js
│   ├── InventoryPage.js
│   ├── CartPage.js
│   └── CheckoutPage.js
├── tests/                  # Test specs, grouped by feature
│   ├── login.spec.js
│   ├── cart.spec.js
│   └── checkout.spec.js
├── .env.example             # Template for required environment variables
├── playwright.config.js     # Test runner & baseURL configuration
└── package.json
```

## Test coverage overview

| Suite | Covers |
|---|---|
| `login.spec.js` | Valid/invalid credentials, locked-out users, empty fields, SQL/script injection, extremely long input, whitespace handling, password field masking, session persistence, back-button-after-logout |
| `cart.spec.js` | Adding/removing single and multiple items, cart badge accuracy, button state toggling, navigation to cart, network loss during add/remove |
| `checkout.spec.js` | Full checkout flow, form validation errors, cancel flow, PDF receipt generation, network loss during checkout submission and PDF generation |

## Getting started

### Prerequisites
- [Node.js](https://nodejs.org/) (v18 or later recommended)

### Installation

```bash
git clone https://github.com/miteshahir0505/saucedemo-playwright-framework.git
cd saucedemo-playwright-framework
npm install
npx playwright install
```

### Configure environment

Copy the example environment file and adjust if needed:

```bash
cp .env.example .env
```

### Running the tests

Run the full suite (all browsers):
```bash
npx playwright test
```

Run a specific suite:
```bash
npx playwright test tests/login.spec.js
npx playwright test tests/cart.spec.js
npx playwright test tests/checkout.spec.js
```

Run on a single browser:
```bash
npx playwright test --project=chromium
```

View the HTML report after a run:
```bash
npx playwright show-report
```

## Notes on the network resilience tests

Several tests simulate a dropped internet connection mid-action (e.g. clicking "Continue" at checkout, or generating a PDF receipt) using `page.context().setOffline()`. Since saucedemo is a static frontend demo, some of these actions turned out to be handled entirely client-side — meaning connectivity loss didn't block them. This was a deliberate exploratory approach: rather than assuming an outcome, these tests observe and log the actual behavior, which is a more honest and realistic way to test resilience than asserting a guessed result.

## Author

Built by [Mitesh Ahir](https://github.com/miteshahir0505) as a hands-on project to learn Playwright, test architecture, and framework design from the ground up.