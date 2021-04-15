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

  get communitySpaceCard() {
    return cy.findByText('Community space').parents('[data-test-id="space-plan-card"]');
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

  goToNewSpace() {
    // If the space creation request takes more than 20 seconds something weird is going on.
    cy.get('[data-test-id="receipt-page.redirect-to-space"]:not([aria-disabled=true])').click({
      timeout: 20000,
    });

    return new SpaceHomePage();
  }
}
