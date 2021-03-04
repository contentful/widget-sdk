export const loginPage = {
  visit: () => {
    cy.visit(`https://be.${Cypress.env('domain')}/login`);
  },
  emailField: () => cy.get('#user_email'),
  passwordField: () => cy.get('#user_password'),
  submitButton: () => cy.get('input[type="submit"]'),
};
