import { defaultRequestsMock } from '../../../util/factories';
import {
  getAllContentTypesInDefaultSpace,
  getDefaultContentType,
  getPublishedVersionOfDefaultContentType,
  getEditorInterfaceForDefaultContentType,
  saveDefaultContentTypeWithCustomSidebar,
  publishDefaultContentType,
  saveDefaultContentTypeEditorInterface
} from '../../../interactions/content_types';
import { getAllExtensionsInDefaultSpace } from '../../../interactions/extensions';
import { defaultContentTypeId, defaultSpaceId } from '../../../util/requests';
import { FeatureFlag } from '../../../util/featureFlag';

describe('Sidebar configuration', () => {
  before(() =>
    cy.startFakeServer({
      consumer: 'user_interface',
      provider: 'extensions',
      cors: true,
      pactfileWriteMode: 'merge',
      spec: 2
    })
  );

  beforeEach(() => {
    cy.resetAllFakeServers();

    cy.enableFeatureFlags([FeatureFlag.ENTRY_ACTIVITY]);

    const interactions = [
      ...defaultRequestsMock(),
      getAllExtensionsInDefaultSpace.willReturnNone(),
      getEditorInterfaceForDefaultContentType.willReturnOneWithoutSidebar(),
      getAllContentTypesInDefaultSpace.willReturnOne(),
      getDefaultContentType.willReturnIt(),
      getPublishedVersionOfDefaultContentType.willReturnIt()
    ];

    cy.visit(
      `/spaces/${defaultSpaceId}/content_types/${defaultContentTypeId}/sidebar_configuration`
    );

    cy.wait(interactions);
  });

  describe('Opening the page with no configuration saved', () => {
    it('renders the page', () => {
      const expectedUrl = `/spaces/${defaultSpaceId}/content_types/${defaultContentTypeId}/sidebar_configuration`;
      cy.getByTestId('sidebar-config-tab')
        .should('be.visible')
        .should('have.attr', 'href')
        .and('eq', expectedUrl);
    });
  });

  describe('Saving the content type with configured custom sidebar', () => {
    beforeEach(() => {
      cy.resetAllFakeServers();
      cy.getByTestId('custom-sidebar-option')
        .find('input')
        .click();
    });

    it('checks that content type with a custom sidebar has been successfully saved', () => {
      const interactions = [
        saveDefaultContentTypeWithCustomSidebar.willSucceed(),
        publishDefaultContentType.willSucceed(),
        getEditorInterfaceForDefaultContentType.willReturnOneWithoutSidebar(),
        saveDefaultContentTypeEditorInterface.willSucceed()
      ];

      cy.getAllByTestId('cf-ui-icon-button')
        .first()
        .click();

      cy.getByTestId('save-content-type').click();

      cy.wait(interactions);

      cy.verifyNotification('success', 'Content type saved successfully');
    });
  });
});
