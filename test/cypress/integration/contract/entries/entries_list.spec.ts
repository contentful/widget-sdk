import { queryFirst100UsersInDefaultSpace } from '../../../interactions/users';
import {
  getAllPublicContentTypesInDefaultSpace,
  getEditorInterfaceForDefaultContentType
} from '../../../interactions/content_types';
import { defaultRequestsMock } from '../../../util/factories';
import { getResourcesWithLimitsReached } from '../../../interactions/resources';
import { queryForTwoSpecificFeaturesInDefaultSpace } from '../../../interactions/product_catalog_features';
import { defaultSpaceId, getEntries } from '../../../util/requests';
import {
  getDefaultEntry,
  queryLinksToDefaultEntry,
  getFirst7SnapshotsOfDefaultEntry,
  createAnEntryInDefaultSpace
} from '../../../interactions/entries';

const empty = require('../../../fixtures/responses/empty.json');
const severalEntriesResponse = require('../../../fixtures/responses/entries-several.json');
const query = {
  limit: '40',
  order: '-sys.updatedAt',
  skip: '0',
  'sys.archivedAt[exists]': 'false'
};
const archivedQuery = {
  limit: '0', // TODO: limit=0 ?? What does this mean?
  'sys.archivedAt[exists]': 'true'
};
describe('Entries list page', () => {
  beforeEach(() => {
    cy.resetAllFakeServers();
    // TODO: Move this to a before block
    cy.startFakeServers({
      consumer: 'user_interface',
      providers: ['entries', 'users'],
      cors: true,
      pactfileWriteMode: 'merge',
      spec: 2
    });
  });

  context('no content types in the space', () => {
    beforeEach(() => {
      // TODO: Move this to interactions/entries
      cy.addInteraction({
        provider: 'entries',
        state: 'noEntries',
        uponReceiving: 'a request for non-archived entries',
        withRequest: getEntries(defaultSpaceId, query),
        willRespondWith: {
          status: 200,
          body: empty
        }
      }).as('query-non-archived-entries');
      // TODO: Move this to interactions/entries
      cy.addInteraction({
        provider: 'entries',
        state: 'noArchivedEntries',
        uponReceiving: 'a request for archived entries',
        withRequest: getEntries(defaultSpaceId, archivedQuery),
        willRespondWith: {
          status: 200,
          body: empty
        }
      }).as('query-archived-entries');

      const interactions = [
        '@query-archived-entries',
        '@query-non-archived-entries',
        ...defaultRequestsMock({}),
        queryFirst100UsersInDefaultSpace.willFindSeveral()
      ]

      cy.visit(`/spaces/${defaultSpaceId}/entries`);

      cy.wait(interactions);
    });

    it('renders entries page correctly', () => {
      cy.getByTestId('no-content-type-advice').should('be.visible');
      cy.getByTestId('create-content-type-empty-state').should('be.enabled');
    });
  });

  context('no entries in the space', () => {
    beforeEach(() => {
      // TODO: Move this to interactions/entries
      cy.addInteraction({
        provider: 'entries',
        state: 'noEntries',
        uponReceiving: 'a request for entries',
        withRequest: getEntries(defaultSpaceId, query),
        willRespondWith: {
          status: 200,
          body: empty
        }
      }).as('query-non-archived-entries');
      // TODO: Move this to interactions/entries
      cy.addInteraction({
        provider: 'entries',
        state: 'noArchivedEntries',
        uponReceiving: 'a request for archived entries',
        withRequest: getEntries(defaultSpaceId, archivedQuery),
        willRespondWith: {
          status: 200,
          body: empty
        }
      }).as('query-archived-entries');

      const interactions = [
        '@query-archived-entries',
        '@query-non-archived-entries',
        ...defaultRequestsMock({
          publicContentTypesResponse: getAllPublicContentTypesInDefaultSpace.willReturnOne
        }),
        queryFirst100UsersInDefaultSpace.willFindSeveral()
      ]

      cy.visit(`/spaces/${defaultSpaceId}/entries`);

      cy.wait(interactions);
    });

    it('renders entries page correctly', () => {
      cy.getByTestId('no-entries-advice').should('be.visible');
      cy.getByTestId('create-entry')
        .should('be.visible')
        .find('button')
        .should('be.enabled');
    });
    it('redirects to the entry page after click on create button', () => {
      const interactions = [
        createAnEntryInDefaultSpace.willSucceed(),
        getDefaultEntry.willReturnIt(),
        queryLinksToDefaultEntry.willReturnNone(),
        getFirst7SnapshotsOfDefaultEntry.willReturnNone(),
        getEditorInterfaceForDefaultContentType.willReturnOneWithoutSidebar()
      ];

      cy.getByTestId('create-entry').click();

      cy.wait(interactions);

      cy.getByTestId('entity-field-controls').should('be.visible');
      cy.getByTestId('entry-editor-sidebar').should('be.visible');
    });
  });

  context('several entries in the space', () => {
    beforeEach(() => {
      // TODO: Move this to interactions/entries
      cy.addInteraction({
        provider: 'entries',
        state: 'severalEntries',
        uponReceiving: 'a request for entries',
        withRequest: getEntries(defaultSpaceId, query),
        willRespondWith: {
          status: 200,
          body: severalEntriesResponse
        }
      }).as('query-non-archived-entries');

      const interactions = [
        '@query-non-archived-entries',
        ...defaultRequestsMock({}),
        queryFirst100UsersInDefaultSpace.willFindSeveral()
      ]

      cy.visit(`/spaces/${defaultSpaceId}/entries`);

      cy.wait(interactions);
    });

    it('renders entries page correctly', () => {
      cy.getByTestId('entry-list').should('be.visible');
      cy.getAllByTestId('entry-row').should('have.length', severalEntriesResponse.total);
    });
  });

  context('with several entries in the space and usage limits reached', () => {
    beforeEach(() => {
      cy.resetAllFakeServers();
      // TODO: Move this to a before block
      cy.startFakeServers({
        consumer: 'user_interface',
        providers: ['resources', 'product_catalog_features'],
        cors: true,
        pactfileWriteMode: 'merge',
        spec: 2
      });

      // TODO: Move this to interactions/entries
      cy.addInteraction({
        provider: 'entries',
        state: 'severalEntries',
        uponReceiving: 'a request for entries',
        withRequest: getEntries(defaultSpaceId, query),
        willRespondWith: {
          status: 200,
          body: severalEntriesResponse
        }
      }).as('query-non-archived-entries');

      const interactions = [
        ...defaultRequestsMock({}),
        '@query-non-archived-entries',
        queryFirst100UsersInDefaultSpace.willFindSeveral(),
        queryForTwoSpecificFeaturesInDefaultSpace.willFindBothOfThem(),
        getResourcesWithLimitsReached.willReturnSeveral()
      ];

      cy.visit(`/spaces/${defaultSpaceId}/entries`);
      cy.wait(interactions);
    });

    it('renders a disabled "Add Entry" button', () => {
      cy.getByTestId('cta').should('be.disabled');
    });
  });
});
