import { defaultRequestsMock } from '../../../util/factories';
import {
  allContentTypesResponse,
  defaultContentTypeResponse,
  defaultPublishedContentTypeResponse,
  editorInterfaceWithoutSidebarResponse
} from '../../../interactions/content_types';
import { noExtensionsResponse } from '../../../interactions/extensions';
import { defaultContentTypeId, defaultSpaceId } from '../../../util/requests';
import * as state from '../../../util/interactionState';

describe('Sidebar configuration', () => {
  before(() =>
    cy.startFakeServer({
      consumer: 'user_interface',
      provider: 'extensions',
      cors: true,
      pactfileWriteMode: 'merge'
    })
  );

  before(() => {
    cy.setAuthTokenToLocalStorage();

    cy.resetAllFakeServers();

    defaultRequestsMock();
    noExtensionsResponse();
    editorInterfaceWithoutSidebarResponse();
    allContentTypesResponse();
    defaultContentTypeResponse();
    defaultPublishedContentTypeResponse();

    cy.visit(
      `/spaces/${defaultSpaceId}/content_types/${defaultContentTypeId}/sidebar_configuration`
    );

    cy.wait([`@${state.Token.VALID}`]);
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
});
