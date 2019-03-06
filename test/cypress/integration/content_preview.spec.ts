describe('Content Preview Page', function() {
  beforeEach(function() {
    cy.clearCookies();
    cy.clearLocalStorage();
    cy.login();
  });
  it('renders create new content preview page', function() {
    cy.visit(`/spaces/${Cypress.env('space_id')}/settings/content_preview/new`);
    cy.get('.content-preview-editor[data-test-id="cf-ui-form"]')
      .should('be.visible')
      .get('h3')
      .should('contain', 'Content preview URLs');
  });
});
