import { singleUser } from '../../../interactions/users';
import {
  singleContentTypeResponse,
  editorInterfaceWithoutSidebarResponse
} from '../../../interactions/content_types';
import { defaultRequestsMock } from '../../../util/factories';
import * as state from '../../../util/interactionState';
import { limitsReachedResourcesResponse } from '../../../interactions/resources';
import { spaceProductCatalogUsageEnforcementResponse } from '../../../interactions/product_catalog_features';
import { defaultSpaceId, getEntries } from '../../../util/requests';
import {
  singleEntryResponse,
  noEntryLinksResponse,
  noEntrySnapshotsResponse,
  postSingleEntryRequest
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
  limit: '0',
  'sys.archivedAt[exists]': 'true'
};
describe('Entries list page', () => {
  beforeEach(() => {
    cy.resetAllFakeServers();
  });

  context('no content types in the space', () => {
    beforeEach(() => {
      defaultRequestsMock({});
      singleUser();

      cy.addInteraction({
        provider: 'entries',
        state: 'noEntries',
        uponReceiving: 'a request for entries',
        withRequest: getEntries(defaultSpaceId, query),
        willRespondWith: {
          status: 200,
          body: empty
        }
      }).as(state.Entries.NONE);

      cy.addInteraction({
        provider: 'entries',
        state: 'noArchivedEntries',
        uponReceiving: 'a request for archived entries',
        withRequest: getEntries(defaultSpaceId, archivedQuery),
        willRespondWith: {
          status: 200,
          body: empty
        }
      }).as('entries/archived-none');

      cy.visit(`/spaces/${defaultSpaceId}/entries`);

      cy.wait([`@${state.Token.VALID}`, `@${state.Entries.NONE}`, '@entries/archived-none']);
    });

    it('renders entries page correctly', () => {
      cy.getByTestId('no-content-type-advice').should('be.visible');
      cy.getByTestId('create-content-type-empty-state').should('be.enabled');
    });
  });

  context('no entries in the space', () => {
    beforeEach(() => {
      defaultRequestsMock({
        publicContentTypesResponse: singleContentTypeResponse
      });
      singleUser();

      cy.addInteraction({
        provider: 'entries',
        state: 'noEntries',
        uponReceiving: 'a request for entries',
        withRequest: getEntries(defaultSpaceId, query),
        willRespondWith: {
          status: 200,
          body: empty
        }
      }).as(state.Entries.NONE);

      cy.addInteraction({
        provider: 'entries',
        state: 'noArchivedEntries',
        uponReceiving: 'a request for archived entries',
        withRequest: getEntries(defaultSpaceId, archivedQuery),
        willRespondWith: {
          status: 200,
          body: empty
        }
      }).as('entries/archived-none');

      cy.visit(`/spaces/${defaultSpaceId}/entries`);

      cy.wait([`@${state.Token.VALID}`, `@${state.Entries.NONE}`, '@entries/archived-none']);
    });

    it('renders entries page correctly', () => {
      cy.getByTestId('no-entries-advice').should('be.visible');
      cy.getByTestId('create-entry')
        .should('be.visible')
        .find('button')
        .should('be.enabled');
    });
    it('redirects to the entry page after click on create button', () => {
      postSingleEntryRequest();
      singleEntryResponse();
      noEntryLinksResponse();
      noEntrySnapshotsResponse();
      editorInterfaceWithoutSidebarResponse();

      cy.getByTestId('create-entry').click();
      cy.getByTestId('entity-field-controls').should('be.visible');
      cy.getByTestId('entry-editor-sidebar').should('be.visible');
    });
  });

  context('several entries in the space', () => {
    beforeEach(() => {
      defaultRequestsMock({});
      singleUser();

      cy.addInteraction({
        provider: 'entries',
        state: 'severalEntries',
        uponReceiving: 'a request for entries',
        withRequest: getEntries(defaultSpaceId, query),
        willRespondWith: {
          status: 200,
          body: severalEntriesResponse
        }
      }).as(state.Entries.SEVERAL);

      cy.visit(`/spaces/${defaultSpaceId}/entries`);

      cy.wait([`@${state.Token.VALID}`, `@${state.Entries.SEVERAL}`]);
    });

    it('renders entries page correctly', () => {
      cy.getByTestId('entry-list').should('be.visible');
      cy.getAllByTestId('entry-row').should('have.length', severalEntriesResponse.total);
    });
  });

  context('with several entries in the space and usage limits reached', () => {
    beforeEach(() => {
      cy.startFakeServers({
        consumer: 'user_interface',
        providers: ['resources', 'product_catalog_features'],
        cors: true,
        pactfileWriteMode: 'merge',
        spec: 2
      });

      defaultRequestsMock({});
      singleUser();

      cy.addInteraction({
        provider: 'entries',
        state: 'severalEntries',
        uponReceiving: 'a request for entries',
        withRequest: getEntries(defaultSpaceId, query),
        willRespondWith: {
          status: 200,
          body: severalEntriesResponse
        }
      }).as(state.Entries.SEVERAL);

      const productCatalogQuery = 'sys.featureId[]=environment_usage_enforcements&sys.featureId[]=basic_apps'
      spaceProductCatalogUsageEnforcementResponse(productCatalogQuery);
      limitsReachedResourcesResponse();

      cy.visit(`/spaces/${defaultSpaceId}/entries`);
      cy.wait([`@${state.Token.VALID}`, `@${state.Entries.SEVERAL}`, `@${state.SpaceProductCatalogFeatures.USAGE_ENFORCEMENT}`, `@${state.Resources.LIMITS_REACHED}`, ]);

    });

    it('renders a disabled "Add Entry" button', () => {
      cy.getByTestId('cta').should('be.disabled');
    });
  });
});
