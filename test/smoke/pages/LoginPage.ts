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

  submitForm() {
    cy.get('input[type="submit"]').click();

    return new SpaceHomePage();
  }
}
