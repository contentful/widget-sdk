import { LoginPage, SpaceHomePage } from './pages';
import { wrapWithDuration } from './telemetry';

test('login', () => {
  const loginPage = LoginPage.visit();

  loginPage.emailField.type(Cypress.env('email'));
  loginPage.passwordField.type(Cypress.env('password'));

  const spaceHome = wrapWithDuration<SpaceHomePage>('login', 'time-login-to-space-home', () => {
    const spaceHome = loginPage.submitForm();

    // The test account will always have at least one space, and should always be the space admin
    // of that space, so we will see the space home on loading.
    spaceHome.container.should('be.visible');

    return spaceHome;
  });

  spaceHome.navBar.accountMenu.open();

  const accountSettings = spaceHome.navBar.accountMenu.goToAccountSettings();

  accountSettings.accountDetailsSection.should('be.visible');
});
