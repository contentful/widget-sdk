import * as state from './interactionState';

const empty = require('../fixtures/empty.json');
const entryResponseBody = require('../fixtures/entry.json');
const spaceId = Cypress.env('spaceId');
export const entryId = 'testEntryId';

export function singleEntryResponse() {
  cy.addInteraction({
    state: state.Entries.EMPTY,
    uponReceiving: 'a request for entry object',
    withRequest: {
      method: 'GET',
      path: `/spaces/${spaceId}/entries/${entryId}`,
      headers: {
        Accept: 'application/json, text/plain, */*'
      }
    },
    willRespondWith: {
      status: 200,
      body: entryResponseBody
    }
  }).as(state.Entries.EMPTY);
}

export function noEntryLinksResponse() {
  cy.addInteraction({
    state: state.Entries.LINKS,
    uponReceiving: 'a request for entry links',
    withRequest: {
      method: 'GET',
      path: `/spaces/${spaceId}/entries`,
      headers: {
        Accept: 'application/json, text/plain, */*'
      },
      query: `links_to_entry=${entryId}`
    },
    willRespondWith: {
      status: 200,
      body: empty
    }
  }).as(state.Entries.LINKS);
}

export function noEntrySnapshotsResponse() {
  cy.addInteraction({
    state: state.Entries.SNAPSHOTS,
    uponReceiving: 'a request for entry snapshots',
    withRequest: {
      method: 'GET',
      path: `/spaces/${spaceId}/entries/${entryId}/snapshots`,
      headers: {
        Accept: 'application/json, text/plain, */*'
      },
      query: 'limit=7'
    },
    willRespondWith: {
      status: 200,
      body: empty
    }
  }).as(state.Entries.SNAPSHOTS);
}
