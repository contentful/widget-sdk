import { SpaceHomePage } from './SpaceHomePage';

export class LoginPage {
  static visit() {
    cy.visit(`https://be.${Cypress.env('domain')}/login`);

    return new LoginPage();
  }

  get emailField() {
    return cy.get('#user_email');
  }

  get passwordField() {
    return cy.get('#user_password');
  }

  /**
   * Log into the app and ensure that the space home is loaded.
   */
  submitForm() {
    cy.get('input[type="submit"]').click();

    return new SpaceHomePage();
  }

  /**
   * Log into the app, without waiting for the space home page to load (just assert
   * that app has loaded). **Do not** use this directly, use the command instead.
   *
   * Used indirectly when logging in via `cy.login()`.
   */
  submitFormQuick() {
    cy.get('input[type="submit"]').click();

    cy.get('cf-app-container').should('be.visible');
  }
}
