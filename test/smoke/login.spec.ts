import { LoginPage } from './pages';

describe('Contentful login', () => {
  it('successfully attempts to log into the web app and goes to the account settings', () => {
    const loginPage = LoginPage.visit();

    // TODO(jo-sm): report how long it takes to go from here to loading the space home (maybe
    // wrapping in some helper/command)
    loginPage.emailField.type(Cypress.env('email'));
    loginPage.passwordField.type(Cypress.env('password'));

    const spaceHome = loginPage.submitForm();

    // The test account will always have at least one space, and should always be the space admin
    // of that space, so we will see the space home on loading.
    spaceHome.container.should('be.visible');

    spaceHome.navBar.accountMenu.open();

    const accountSettings = spaceHome.navBar.accountMenu.goToAccountSettings();

    accountSettings.accountDetailsSection.should('be.visible');
  });
});
