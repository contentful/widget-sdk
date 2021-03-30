import { AccountSettingsPage } from './AccountSettingsPage';
import { OrganizationSettingsPage } from './OrganizationSettingsPage';

export class NavBar {
  get accountMenu() {
    return new AccountMenu();
  }

  get sidePanel() {
    return new SidePanel();
  }
}

class SidePanel {
  open() {
    cy.findByTestId('sidepanel-trigger').click();
  }

  goToOrganizationSettings() {
    cy.findByTestId('sidepanel-org-actions-settings').click();

    return new OrganizationSettingsPage();
  }
}

class AccountMenu {
  open() {
    cy.findByTestId('account-menu-trigger').click();
  }

  goToAccountSettings() {
    cy.findByTestId('nav.account.userProfile').click();

    return new AccountSettingsPage();
  }
}
