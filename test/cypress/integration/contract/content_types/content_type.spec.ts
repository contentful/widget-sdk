import { defaultRequestsMock } from '../../../util/factories';
import { defaultSpaceId } from '../../../util/requests';
import {
  getEditorInterfaceForDefaultContentType,
  getAllContentTypesInDefaultSpace,
  getDefaultContentType,
  getPublishedVersionOfDefaultContentType
} from '../../../interactions/content_types';
import { getAllExtensionsInDefaultSpace } from '../../../interactions/extensions';
import { defaultContentTypeId } from '../../../util/requests';

describe('Content type page', () => {
  before(() => {
    cy.resetAllFakeServers();

    cy.startFakeServer({
      consumer: 'user_interface',
      provider: 'extensions',
      cors: true,
      pactfileWriteMode: 'merge',
      spec: 2
    });
  });

  context('content type with one field', () => {
    beforeEach(() => {
      const interactions = [
        ...defaultRequestsMock(),
        getAllExtensionsInDefaultSpace.willReturnNone(),
        getEditorInterfaceForDefaultContentType.willReturnOneWithoutSidebar(),
        getAllContentTypesInDefaultSpace.willReturnOne(),
        getDefaultContentType.willReturnIt(),
        getPublishedVersionOfDefaultContentType.willReturnIt()
      ];

      cy.visit(`/spaces/${defaultSpaceId}/content_types/${defaultContentTypeId}`);

      cy.wait(interactions);
    });
    it('renders the page', () => {
      cy.get('[name=contentTypeForm]').should('be.visible');
      cy.getByTestId('save-content-type').should('be.enabled');
      cy.getByTestId('add-field-button').should('be.enabled');
    });
  });
});
