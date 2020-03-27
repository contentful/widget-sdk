import { defaultRequestsMock } from '../../../util/factories';
import {
  getAllContentTypesInDefaultSpace,
  getDefaultContentType,
  getPublishedVersionOfDefaultContentType,
  getEditorInterfaceForDefaultContentType,
  saveDefaultContentTypeWithCustomSidebar,
  publishDefaultContentType,
  saveDefaultContentTypeEditorInterface,
} from '../../../interactions/content_types';
import { defaultContentTypeId, defaultSpaceId } from '../../../util/requests';

describe('Sidebar configuration', () => {
  beforeEach(() => {
    cy.resetAllFakeServers();

    const interactions = [
      ...defaultRequestsMock(),
      getEditorInterfaceForDefaultContentType.willReturnOneWithoutSidebar(),
      getAllContentTypesInDefaultSpace.willReturnOne(),
      getDefaultContentType.willReturnIt(),
      getPublishedVersionOfDefaultContentType.willReturnIt(),
    ];

    cy.visit(
      `/spaces/${defaultSpaceId}/content_types/${defaultContentTypeId}/sidebar_configuration`
    );

    cy.wait(interactions);
  });

  describe('Saving the content type with configured custom sidebar', () => {
    beforeEach(() => {
      cy.resetAllFakeServers();
      cy.getByTestId('custom-sidebar-option').find('input').click();
    });

    it('checks that content type with a custom sidebar has been successfully saved', () => {
      const interactions = [
        saveDefaultContentTypeWithCustomSidebar.willSucceed(),
        publishDefaultContentType.willSucceed(),
        getEditorInterfaceForDefaultContentType.willReturnOneWithoutSidebar(),
        saveDefaultContentTypeEditorInterface.willSucceed(),
      ];

      cy.getAllByTestId('cf-ui-icon-button').first().click();

      cy.getByTestId('save-content-type').click();

      cy.wait(interactions);

      cy.verifyNotification('success', 'Content type saved successfully');
    });
  });
});
