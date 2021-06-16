import { OrganizationSettingsPage } from '../OrganizationSettingsPage';

export class SidePanel {
  open() {
    cy.findByTestId('sidepanel-trigger').click();
  }

  goToSpace(name: string) {
    // it looks like we need to wait until space home is loaded until we can proceed
    // test tends to be flaky otherwise
    cy.findByTestId('admin-space-home').should('be.visible');

    this.open();
    cy.findByTestId('sidepanel').findByText(name).click();
    cy.findByTestId('admin-space-home').should('contain.text', name);
  }

  goToOrganizationSettings() {
    cy.findByTestId('sidepanel')
      .findByText(/Organization settings/)
      .click();

    return new OrganizationSettingsPage();
  }

  goToEnvironment(spaceName: string, envId: string) {
    this.open();
    cy.findByTestId('sidepanel').findByTestId('cf-ui-list').findByText(spaceName).click();
    cy.get(`a[href*="${envId}"]`).click();
  }

  get environmentInfo() {
    return cy.findByTestId('envoralias.wrapper-active');
  }
}
