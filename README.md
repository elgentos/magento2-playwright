# Magento 2 BDD E2E testing suite

A Behavior Driven Development (BDD) End-To-End (E2E) testing suite for Magento 2 using Gherkin syntax in JSDoc and Playwright.

## Table of Contents

- [Introduction](#introduction)
- [Why BDD and Gherkin in JSDoc for Magento 2](#why-bdd-and-gherkin-in-jsdoc-for-magento-2)
- [Features](#features)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
- [Usage](#usage)
  - [Writing Tests](#writing-tests)
  - [Running Tests](#running-tests)
- [Examples](#examples)
- [Contributing](#contributing)
- [License](#license)
- [Contact](#contact)

## Introduction

Welcome to the Magento 2 BDD E2E Testing Suite! This project is an open-source initiative aimed at simplifying and enhancing the way developers write and maintain end-to-end tests for Magento 2 applications.

By combining the power of Behavior Driven Development (BDD) with the flexibility of Playwright and the clarity of Gherkin syntax embedded in JSDoc comments, we aim to make testing more accessible, readable, and maintainable for both developers and non-technical stakeholders.

## Why BDD and Gherkin in JSDoc for Magento 2

Testing in Magento 2 can be complex due to its extensive functionality and customizable nature. Traditional testing methods often result in tests that are hard to read and maintain, especially as the application grows.

**Behavior Driven Development (BDD)** focuses on the behavior of the application from the user's perspective. It encourages collaboration between developers, QA engineers, and business stakeholders by using a shared language to describe application behavior.

[Gherkin syntax](https://cucumber.io/docs/gherkin/reference/) is a domain-specific language that uses natural language constructs to describe software behaviors. By embedding Gherkin steps directly into JSDoc comments, we achieve several benefits:

- **Readability**: tests become self-documenting and easier to understand.
- **Maintainability**: changes in requirements can be quickly reflected in the test descriptions.
- **Collaboration**: non-technical team members can read and even help write test cases.
- **Integration**: embedding in JSDoc keeps the test descriptions close to the implementation, reducing context switching.

[Playwright](https://playwright.dev/) is a powerful automation library that supports all modern browsers. It offers fast and reliable cross-browser testing, which is essential for ensuring Magento 2 applications work seamlessly across different environments.

By integrating these technologies, this testing suite provides a robust framework that simplifies the process of writing, running, and maintaining end-to-end tests for Magento 2.

## Features

- **Gherkin Syntax in JSDoc**: write human-readable test steps directly in your code comments.
- **Playwright integration**: utilize Playwright's powerful automation capabilities for testing across different browsers.
- **Magento 2 specific utilities**: predefined steps and helpers tailored for Magento 2's unique features.
- **Collaborative testing**: enable collaboration between technical and non-technical team members.
- **Extensible architecture**: easily extend and customize to fit your project's needs.

## Folder structure for fixtures
Organizing your fixture folder structure into ``before, during, and verify`` creates a clear chronological flow for your tests. This approach enhances readability and maintains a structured separation of concerns:

- ``before``: contains setup data like slugs to prepare the test environment.
- ``during``: holds selectors and input values needed during the test execution.
- ``verify``: includes expected results or assertions to validate test outcomes.

By naming the folders this way, they naturally sort in the desired order, making the test workflow intuitive and easy to follow.

## Getting Started

### Prerequisites

- **Node.js**: Ensure you have Node.js installed (version 14 or higher).
- **Magento 2 instance**: A running instance of Magento 2 for testing purposes. Elgentos sponsors a [Hyvä demo website](https://hyva-demo.elgentos.io/) for this project.
- **Git**: Version control system to clone the repository.

### Installation

1. **Clone the repository**

   ```bash
   git clone https://github.com/elgentos/magento2-bdd-e2e-testing-suite.git
   ```

2. **Navigate to the project directory**

   ```bash
   cd magento2-bdd-e2e-testing-suite
   ```

3. **Install dependencies**

   ```bash
   npm install
   ```

4. **Configure environment**

   Copy the example environment file and update it with your configuration.

   ```bash
   cp .env.example .env
   cp playwright.config.example.ts playwright.config.ts
   cp tests/base/test-toggles.example.json tests/base/test-toggles.json 
   ```

   Update `.env` with your Magento 2 instance URL and other necessary settings.

## Usage

### Writing tests

Tests are written in JavaScript using the Gherkin syntax within JSDoc comments. This approach keeps the test descriptions close to the implementation, making it easier to maintain and understand.

Here's an example of how to write a test:

```javascript
/**
 * @feature Magento 2 Product Search
 *   @scenario User searches for a product on the Magento 2 homepage
 *     @given I am on the Magento 2 homepage
 *     @when I search for "Example Product"
 *     @then I should see "Example Product" in the search results
 */
test('User can search for a product', async ({ page }) => {
  // Test implementation using Playwright
});
```

### Running tests

To execute the tests, run:

```bash
npx playwright test
```

This command will run all tests located in the `tests` directory.

You can also run a specific test file:

```bash
npx playwright test tests/example.test.js
```

## Examples

Below are some example tests to illustrate how to write and structure your tests.

### User registration test

```javascript
/**
 * @feature Product Checkout
 *   @scenario User completes a purchase
 *     @given I have a product in my cart
 *     @when I proceed to checkout
 *     @and I complete the checkout process
 *     @then I should receive an order confirmation
 */
test('User can register an account', async ({ page }) => {
  // Implementation details
});
```

### Checkout process test

```javascript
/**
 * @feature User Registration
 *   @scenario User successfully registers on the website
 *     @given I am on the registration page
 *     @when I fill in the registration form with valid data
 *     @and I submit the form
 *     @then I should see a confirmation message
 */
test('User can complete the checkout process', async ({ page }) => {
  // Implementation details
});
```

## Contributing

We welcome contributions to enhance this project! Here's how you can get involved:

1. **Clone this repository**

   ```bash
   git clone https://github.com/elgentos/magento2-bdd-e2e-testing-suite
   ```

2. **Create a branch**

   ```bash
   git checkout -b feature/your-feature-name
   ```

3. **Make your changes**

4. **Commit your changes**

   ```bash
   git commit -am 'Add a new feature'
   ```

5. **Push to your fork**

   ```bash
   git push origin feature/your-feature-name
   ```

6. **Open a pull request**: Go to the original repository and open a pull request with a detailed description of your changes.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Contact

If you have any questions, suggestions, or feedback, please open an issue on GitHub.
