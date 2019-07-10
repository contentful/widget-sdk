import { defaultRequestsMock } from '../../../util/factories';
import {
  allContentTypesResponse,
  defaultContentTypeResponse,
  defaultPublishedContentTypeResponse,
  editorInterfaceWithoutSidebarResponse,
  defaultContentTypeWithCustomSidebarCreatedResponse,
  defaultPublishedContentTypeWithCustomSidebarCreatedResponse,
  editorInterfaceWithCustomSidebarSavedResponse
} from '../../../interactions/content_types';
import { noExtensionsResponse } from '../../../interactions/extensions';
import { defaultContentTypeId, defaultSpaceId } from '../../../util/requests';
import * as state from '../../../util/interactionState';
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

    defaultRequestsMock();
    noExtensionsResponse();
    editorInterfaceWithoutSidebarResponse();
    allContentTypesResponse();
    defaultContentTypeResponse();
    defaultPublishedContentTypeResponse();

    cy.visit(
      `/spaces/${defaultSpaceId}/content_types/${defaultContentTypeId}/sidebar_configuration`
    );

    cy.wait([
      `@${state.Token.VALID}`,
      `@${state.ContentTypes.DEFAULT_CONTENT_TYPE_IS_PUBLISHED}`
    ]);
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
      defaultContentTypeWithCustomSidebarCreatedResponse();
      defaultPublishedContentTypeWithCustomSidebarCreatedResponse();
      editorInterfaceWithoutSidebarResponse();
      editorInterfaceWithCustomSidebarSavedResponse();

      cy.getByTestId('sidebar-widget-item')
        .first()
        .getByTestId('cf-ui-icon-button')
        .click();
      cy.getByTestId('save-content-type').click();

      cy.wait([
        '@content-type-custom-sidebar-created',
        '@content-type-published-custom-sidebar-created',
        `@${state.ContentTypes.EDITORINTERFACE_WITHOUT_SIDEBAR}`,
        `@editor-interface-sidebar-saved`
      ]);

      cy.verifyNotification('success', 'Content type saved successfully');
    });
  });
});
