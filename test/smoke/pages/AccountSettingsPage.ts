export class AccountSettingsPage {
  get accountDetailsSection() {
    return cy.findByTestId('account-details-section-card');
  }
}
