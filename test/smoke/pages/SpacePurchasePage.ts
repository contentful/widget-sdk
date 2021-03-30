import { SpaceHomePage } from './SpaceHomePage';

export class SpacePurchasePage {
  static visit(organizationId: string) {
    cy.visit(
      `https://app.${Cypress.env('domain')}/account/organizations/${organizationId}/new_space`
    );

    return new SpacePurchasePage();
  }

  constructor() {
    cy.get('[data-test-id="space-plan-card"]:not([aria-disabled=true])', { timeout: 12500 });
  }

  get mediumSpacePlanCard() {
    return cy.findByText('Medium space').parents('[data-test-id="space-plan-card"]');
  }

  get webAppPlatformCard() {
    return cy
      .findAllByTestId('platform-card')
      .findByText('Web app only')
      .parents('[data-test-id="platform-card"]');
  }

  get spaceSelectionContinueButton() {
    return cy.findByTestId('platform-select-continue-button');
  }

  get spaceNameInput() {
    return cy.findByTestId('space-name').findByTestId('cf-ui-text-input');
  }

  get spaceDetailsContinueButton() {
    return cy.findByTestId('next-step-new-details-page');
  }

  get confirmPurchaseButton() {
    return cy.findByTestId('confirm-purchase-button');
  }

  goToNewSpace() {
    // This will likely eventually start timing out as more and more spaces are added and deleted from the org.
    // This is because each space addition / deletion is a Zuora amendment and these slowly get slower the more
    // amendments are made to a subscription. If this starts to fail, make a new subscription for the org.
    cy.get('[data-test-id="receipt-page.redirect-to-space"]:not([aria-disabled=true])').click({
      timeout: 30000,
    });

    return new SpaceHomePage();
  }
}
