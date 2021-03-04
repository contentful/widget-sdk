describe('Contentful login', () => {
  it('successfully attempts to log into the web app and goes to the account settings', () => {
    // TODO(jo-sm): ensure that this is working on the CI (not blocked by Imperva)
    cy.visit(`https://be.${Cypress.env('domain')}/login`);

    // TODO(jo-sm): report how long it takes to go from here to loading the space home (maybe
    // wrapping in some helper/command)
    cy.get('#user_email').type(Cypress.env('email'));
    cy.get('#user_password').type(Cypress.env('password'));

    cy.get('input[type="submit"]').click();

    // The test account will always have at least one space, and should always be the space admin
    // of that space, so we will see the space home on loading.

    cy.findByTestId('admin-space-home', { timeout: 20000 });

    cy.findByTestId('account-menu-trigger').click();
    cy.findByTestId('nav.account.userProfile').click();

    cy.findByTestId('account-details-section-card').should('be.visible');
  });
});
