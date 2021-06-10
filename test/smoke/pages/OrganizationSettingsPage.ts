export class OrganizationSettingsPage {
  static visit(organizationId: string) {
    cy.visit(
      `https://app.${Cypress.env(
        'domain'
      )}/account/organizations/${organizationId}/subscription_overview`
    );

    return new OrganizationSettingsPage();
  }

  get spacesTable() {
    return cy.findByTestId('subscription-page.table');
  }

  get spaceTableRows() {
    return cy.findAllByTestId('subscription-page.spaces-list.table-row');
  }

  getSpaceTableRow(spaceName: string) {
    return new SpaceTableRow(spaceName);
  }
}

class SpaceTableRow {
  constructor(private spaceName: string) {}

  private get row() {
    return cy
      .findByTestId('subscription-page.table')
      .findByText(this.spaceName)
      .parents('[data-test-id="subscription-page.spaces-list.table-row"]');
  }

  get menuTrigger() {
    return this.row.findByTestId('subscription-page.spaces-list.dropdown-menu');
  }

  openDeleteSpaceModal() {
    cy.findByTestId('subscription-page.spaces-list.delete-space-link').click();

    return new DeleteSpaceModal();
  }
}

class DeleteSpaceModal {
  get spaceNameInput() {
    return cy.findByTestId('space-name-confirmation-field');
  }

  confirm() {
    cy.findByTestId('delete-space-confirm-button').click();

    // See SpacePurchasePage#goToNewSpace description. This timeout will likely eventually fail.
    cy.findByTestId('delete-space-modal', { timeout: 30000 }).should('not.be.visible');
  }
}
