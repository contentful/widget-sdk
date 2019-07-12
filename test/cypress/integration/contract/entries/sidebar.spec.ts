import { defaultRequestsMock } from '../../../util/factories';
import { singleUser } from '../../../interactions/users';
import {
  getAllPublicContentTypesInDefaultSpace,
  getEditorInterfaceForDefaultContentType
} from '../../../interactions/content_types';
import {
  singleEntryResponse,
  noEntryLinksResponse,
  noEntrySnapshotsResponse
} from '../../../interactions/entries';
import * as state from '../../../util/interactionState';
import { defaultEntryId, defaultSpaceId } from '../../../util/requests';

describe('Entries page', () => {
  beforeEach(() => {
    cy.resetAllFakeServers();
    basicServerSetUp();
  });

  context('with no sidebar in the editor_interface', () => {
    beforeEach(() => {
      noEntryLinksResponse();
      noEntrySnapshotsResponse();
      getEditorInterfaceForDefaultContentType.willReturnOneWithoutSidebar();
      cy.visit(`/spaces/${defaultSpaceId}/entries/${defaultEntryId}`);
    });
    describe('Opening the Entry page', () => {
      it('shows the default sidebar', () => {
        const widgetNames = ['Status', 'Preview', 'Links', 'Translation', 'Versions', 'Users'];

        cy.wait([
          `@${state.Token.VALID}`,
          `@${state.ContentTypes.EDITORINTERFACE_WITHOUT_SIDEBAR}`
        ]);

        cy.wait(
          [
            `@${state.Entries.NO_LINKS_TO_DEFAULT_ENTRY}`,
            `@${state.Entries.NO_SNAPSHOTS_FOR_DEFAULT_ENTRY}`
          ],
          { timeout: 10000 }
        );

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
    beforeEach(() => {
      getEditorInterfaceForDefaultContentType.willReturnOneWithSidebar();
      cy.visit(`/spaces/${defaultSpaceId}/entries/${defaultEntryId}`);
    });
    describe('Opening the Entry page', () => {
      it('shows the customised sidebar', () => {
        cy.wait([`@${state.Token.VALID}`, `@${state.ContentTypes.EDITORINTERFACE_WITH_SIDEBAR}`]);
        cy.getByTestId('entry-editor-sidebar')
          .find('h2')
          .should('have.length', '1')
          .and('contain', 'Status');
      });
    });
  });
});

function basicServerSetUp() {
  cy.resetAllFakeServers();
  cy.startFakeServers({
    consumer: 'user_interface',
    providers: ['entries', 'users'],
    cors: true,
    pactfileWriteMode: 'merge',
    spec: 2
  });
  defaultRequestsMock({ publicContentTypesResponse: getAllPublicContentTypesInDefaultSpace.willReturnOneContentType });
  singleUser();
  singleEntryResponse();
  cy.route('**/channel/**', []).as('shareJS');
}
