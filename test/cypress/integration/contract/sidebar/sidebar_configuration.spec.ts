import { defaultRequestsMock } from '../../../util/factories';
import {
  getDefaultContentType,
  getEditorInterfaceForDefaultContentType,
  saveDefaultContentTypeWithCustomSidebar,
  publishDefaultContentType,
  saveDefaultContentTypeEditorInterface,
} from '../../../interactions/content_types';
import { defaultContentTypeId, defaultSpaceId } from '../../../util/requests';
import {
  queryForCustomSidebarInDefaultOrg,
  queryForTeamsInDefaultOrg,
  queryForSelfConfigureSsoInDefaultOrg,
  queryForScimInDefaultOrg,
} from '../../../interactions/product_catalog_features';

describe('Sidebar configuration', () => {
  beforeEach(() => {
    cy.resetAllFakeServers();
    // TODO: move this to a before block
    cy.startFakeServers({
      consumer: 'user_interface',
      providers: ['jobs', 'entries', 'users', 'product_catalog_features', 'apps'],
      cors: true,
      pactfileWriteMode: 'merge',
      dir: Cypress.env('pactDir'),
      spec: 2,
    });

    cy.server();

    const interactions = [
      ...defaultRequestsMock(),
      getEditorInterfaceForDefaultContentType.willReturnOneWithoutSidebar(),
      getDefaultContentType.willReturnIt(),
      queryForCustomSidebarInDefaultOrg.willFindFeatureEnabled(),
      queryForTeamsInDefaultOrg.willFindFeatureEnabled(),
      queryForSelfConfigureSsoInDefaultOrg.willFindFeatureEnabled(),
      queryForScimInDefaultOrg.willFindFeatureEnabled(),
    ];

    cy.visit(
      `/spaces/${defaultSpaceId}/content_types/${defaultContentTypeId}/sidebar_configuration`
    );

    cy.wait(interactions);
  });

  describe('Saving the content type with configured custom sidebar', () => {
    beforeEach(() => {
      cy.resetAllFakeServers();
    });

    it('checks that content type with a custom sidebar has been successfully saved', () => {
      const interactions = [
        saveDefaultContentTypeWithCustomSidebar.willSucceed(),
        publishDefaultContentType.willSucceed(),
        getEditorInterfaceForDefaultContentType.willReturnOneWithoutSidebar(),
        saveDefaultContentTypeEditorInterface.willSucceed(),
      ];

      cy.findAllByTestId('remove-selected-widget').first().click();

      cy.findByTestId('save-content-type').click();

      cy.wait(interactions);

      cy.verifyNotification('success', 'Content type saved successfully');
    });
  });
});
