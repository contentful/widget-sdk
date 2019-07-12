import { defaultRequestsMock } from '../../../util/factories';
import * as state from '../../../util/interactionState';
import { defaultSpaceId } from '../../../util/requests';
import {
  getEditorInterfaceForDefaultContentType,
  getAllContentTypesInDefaultSpace,
  getDefaultContentTypeInDefaultSpace,
  getPublishedVersionOfDefaultContentType
} from '../../../interactions/content_types';
import { noExtensionsResponse } from '../../../interactions/extensions';
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
      defaultRequestsMock();
      noExtensionsResponse();
      getEditorInterfaceForDefaultContentType.willReturnOneWithoutSidebar();
      getAllContentTypesInDefaultSpace.willReturnOneContentType();
      getDefaultContentTypeInDefaultSpace.willReturnTheDefaultContentType();
      getPublishedVersionOfDefaultContentType.willReturnThePublishedVersion();

      cy.visit(`/spaces/${defaultSpaceId}/content_types/${defaultContentTypeId}`);

      cy.wait([`@${state.Token.VALID}`, `@${state.ContentTypes.DEFAULT_CONTENT_TYPE_IS_PUBLISHED}`]);
    });
    it('renders the page', () => {
      cy.get('[name=contentTypeForm]').should('be.visible');
      cy.getByTestId('save-content-type').should('be.enabled');
      cy.getByTestId('add-field-button').should('be.enabled');
    });
  });
});
