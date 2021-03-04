import { navigationMenu, loginPage, spaceHome, accountSettings } from './support/page-objects';

describe('Contentful login', () => {
  it('successfully attempts to log into the web app and goes to the account settings', () => {
    // TODO(jo-sm): ensure that this is working on the CI (not blocked by Imperva)
    loginPage.visit();

    // TODO(jo-sm): report how long it takes to go from here to loading the space home (maybe
    // wrapping in some helper/command)
    loginPage.emailField().type(Cypress.env('email'));
    loginPage.passwordField().type(Cypress.env('password'));
    loginPage.submitButton().click();

    // The test account will always have at least one space, and should always be the space admin
    // of that space, so we will see the space home on loading.
    spaceHome.container({ timeout: 20000 }).should('be.visible');

    navigationMenu.openUserProfile();

    accountSettings.accountDetailsSection().should('be.visible');
  });
});
