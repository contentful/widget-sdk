import { AccountSettingsPage } from '../AccountSettingsPage';

export class AccountMenu {
  open() {
    cy.findByTestId('account-menu-trigger').click();
  }

  goToAccountSettings() {
    cy.findByTestId('nav.account.userProfile').click();

    return new AccountSettingsPage();
  }
}
