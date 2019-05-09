import { defaultRequestsMock } from '../../util/factories';
import { singleUser } from '../../interactions/users';
import {
  singleContentTypeResponse,
  editorInterfaceWithoutSidebarResponse,
  editorInterfaceWithSidebarResponse
} from '../../interactions/content_types';
import {
  singleEntryResponse,
  noEntryLinksResponse,
  noEntrySnapshotsResponse
} from '../../interactions/entries';
import * as state from '../../util/interactionState';
import { defaultEntryId, defaultSpaceId } from '../../util/requests';

describe('Entries page', () => {
  context('with no sidebar in the editor_interface', () => {
    before(() => {
      cy.setAuthTokenToLocalStorage();

      cy.resetAllFakeServers();

      defaultRequestsMock({ publicContentTypesResponse: singleContentTypeResponse });
      singleUser();
      singleEntryResponse();
      cy.route('**/channel/**', []).as('shareJS');
      noEntryLinksResponse();
      noEntrySnapshotsResponse();
      editorInterfaceWithoutSidebarResponse();
      cy.visit(`/spaces/${defaultSpaceId}/entries/${defaultEntryId}`);
    });
    describe('Opening the Entry page', () => {
      it('shows the default sidebar', () => {
        const widgetNames = [
          'Status',
          'Preview',
          'Links',
          'Translation',
          'Versions',
          'Users',
          'Entry activity'
        ];

        cy.wait([
          `@${state.Token.VALID}`,
          `@${state.PreviewEnvironments.NONE}`,
          `@${state.ContentTypes.EDITORINTERFACE_WITH_NO_SIDEBAR}`
        ]);

        cy.getByTestId('entry-editor-sidebar')
          .find('h2')
          .should('have.length', widgetNames.length)
          .each(($widget, index) => {
            cy.wrap($widget).should('have.text', widgetNames[index]);
          });
      });
    });
  });

  context('with a sidebar in the editor_interface', () => {
    before(() => {
      cy.setAuthTokenToLocalStorage();

      cy.resetAllFakeServers();

      defaultRequestsMock({ publicContentTypesResponse: singleContentTypeResponse });
      singleUser();
      singleEntryResponse();
      cy.route('**/channel/**', []).as('shareJS');
      editorInterfaceWithSidebarResponse();
      cy.visit(`/spaces/${defaultSpaceId}/entries/${defaultEntryId}`);
    });
    describe('Opening the Entry page', () => {
      it('shows the customised sidebar', () => {
        cy.wait([
          `@${state.Token.VALID}`,
          `@${state.PreviewEnvironments.NONE}`,
          `@${state.ContentTypes.EDITORINTERFACE_WITH_SIDEBAR}`
        ]);
        cy.getByTestId('entry-editor-sidebar')
          .find('h2')
          .should('have.length', '1')
          .and('contain', 'Status');
      });
    });
  });
});
