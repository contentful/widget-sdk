import { singleUser } from '../../interactions/users';
import { singleContentTypeResponse } from '../../interactions/content_types';
import { defaultRequestsMock } from '../../util/factories';
import * as state from '../../util/interactionState';
import { defaultSpaceId, getEntries } from '../../util/requests';

const empty = require('../../fixtures/empty.json');
const severalEntriesResponse = require('../../fixtures/entries-several.json');
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

describe('Entries page', () => {
  context('no content types in the space', () => {
    before(() => {
      cy.resetAllFakeServers();

      defaultRequestsMock({});

      singleUser();

      cy.setAuthTokenToLocalStorage();

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

      cy.wait([
        `@${state.Token.VALID}`,
        `@${state.PreviewEnvironments.NONE}`,
        `@${state.Entries.NONE}`,
        '@entries/archived-none'
      ]);
    });

    describe('opening the page', () => {
      it('renders entries page correctly', () => {
        cy.getByTestId('no-content-type-advice').should('be.visible');
        cy.getByTestId('create-content-type-empty-state').should('be.enabled');
      });
    });
  });
  context('no entries in the space', () => {
    before(() => {
      cy.resetAllFakeServers();

      defaultRequestsMock({
        publicContentTypesResponse: singleContentTypeResponse
      });

      singleUser();

      cy.setAuthTokenToLocalStorage();

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

      cy.wait([
        `@${state.Token.VALID}`,
        `@${state.PreviewEnvironments.NONE}`,
        `@${state.Entries.NONE}`,
        '@entries/archived-none'
      ]);
    });

    describe('opening the page', () => {
      it('renders entries page correctly', () => {
        cy.getByTestId('no-entries-advice').should('be.visible');
        cy.getByTestId('create-entry')
          .should('be.visible')
          .find('button')
          .should('be.enabled');
      });
    });
  });

  context('several entries in the space', () => {
    before(() => {
      cy.resetAllFakeServers();

      defaultRequestsMock({});

      singleUser();

      cy.setAuthTokenToLocalStorage();

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

      cy.wait([
        `@${state.Token.VALID}`,
        `@${state.PreviewEnvironments.NONE}`,
        `@${state.Entries.SEVERAL}`
      ]);
    });

    describe('opening the page', () => {
      it('renders entries page correctly', () => {
        cy.getByTestId('cf-ui-tab-panel').should('be.visible');
        cy.getByTestId('entry-list').should('be.visible');
        cy.getAllByTestId('entry-row').should('have.length', severalEntriesResponse.total);
      });
    });
  });
});
