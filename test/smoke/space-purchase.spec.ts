import { SpacePurchasePage, OrganizationSettingsPage } from './pages';
import { id as randomId } from '../../src/javascripts/utils/Random';

test('space-purchase', () => {
  const orgId = Cypress.env('selfServiceOrgId');

  cy.login();

  const spacePurchasePage = SpacePurchasePage.visit(orgId);

  spacePurchasePage.mediumSpacePlanCard.click();
  spacePurchasePage.webAppPlatformCard.click();
  spacePurchasePage.spaceSelectionContinueButton.click();

  const newSpaceName = randomId();

  spacePurchasePage.spaceNameInput.clear();
  spacePurchasePage.spaceNameInput.type(newSpaceName);
  spacePurchasePage.spaceDetailsContinueButton.click();

  spacePurchasePage.confirmPurchaseButton.click();

  const spaceHome = spacePurchasePage.goToNewSpace();

  spaceHome.container.should('be.visible');

  spaceHome.navBar.sidePanel.open();

  let orgSettingsPage = spaceHome.navBar.sidePanel.goToOrganizationSettings();
  orgSettingsPage.spacesTable.scrollIntoView();

  orgSettingsPage.spaceTableRows.count().then((numSpaces) => {
    const row = orgSettingsPage.getSpaceTableRow(newSpaceName);

    row.menuTrigger.click();

    const deleteSpaceModal = row.openDeleteSpaceModal();

    deleteSpaceModal.spaceNameInput.type(newSpaceName);
    deleteSpaceModal.confirm();

    orgSettingsPage = OrganizationSettingsPage.visit(orgId);

    orgSettingsPage.spaceTableRows.count().should('equal', numSpaces - 1);
  });
});
