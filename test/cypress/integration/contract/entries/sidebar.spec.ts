import { defaultRequestsMock } from '../../../util/factories';
import { queryFirst100UsersInDefaultSpace } from '../../../interactions/users';
import {
  getAllPublicContentTypesInDefaultSpace,
  getEditorInterfaceForDefaultContentType
} from '../../../interactions/content_types';
import {
  getDefaultEntry,
  queryLinksToDefaultEntry,
  getFirst7SnapshotsOfDefaultEntry
} from '../../../interactions/entries';
import { defaultEntryId, defaultSpaceId } from '../../../util/requests';

describe('Entries page', () => {
  let interactions: string[]
  beforeEach(() => {
    cy.resetAllFakeServers();
    interactions = basicServerSetUp();
  });

  context('with no sidebar in the editor_interface', () => {
    beforeEach(() => {
      interactions.push(
        getEditorInterfaceForDefaultContentType.willReturnOneWithoutSidebar(),
      )

      const slowInteractions = [
        queryLinksToDefaultEntry.willReturnNone(),
        getFirst7SnapshotsOfDefaultEntry.willReturnNone()
      ]

      cy.visit(`/spaces/${defaultSpaceId}/entries/${defaultEntryId}`);

      cy.wait(interactions);

      cy.wait(
        slowInteractions,
        { timeout: 10000 }
      );
    });
    describe('Opening the Entry page', () => {
      it('shows the default sidebar', () => {
        const widgetNames = ['Status', 'Preview', 'Links', 'Translation', 'Versions', 'Users'];

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
      interactions.push(getEditorInterfaceForDefaultContentType.willReturnOneWithSidebar());

      cy.visit(`/spaces/${defaultSpaceId}/entries/${defaultEntryId}`);

      cy.wait(interactions);
    });
    describe('Opening the Entry page', () => {
      it('shows the customised sidebar', () => {
        cy.getByTestId('entry-editor-sidebar')
          .find('h2')
          .should('have.length', '1')
          .and('contain', 'Status');
      });
    });
  });
});

function basicServerSetUp(): string[] {
  cy.resetAllFakeServers();
  // TODO: Move this to a before block
  cy.startFakeServers({
    consumer: 'user_interface',
    providers: ['entries', 'users'],
    cors: true,
    pactfileWriteMode: 'merge',
    spec: 2
  });

  cy.server();
  cy.route('**/channel/**', []).as('shareJS');

  return [
    ...defaultRequestsMock({
      publicContentTypesResponse: getAllPublicContentTypesInDefaultSpace.willReturnOne
    }),
    queryFirst100UsersInDefaultSpace.willFindSeveral(),
    getDefaultEntry.willReturnIt()
  ];
}
