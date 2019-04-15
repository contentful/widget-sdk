const empty = require('../fixtures/empty.json');
const entryResponseBody = require('../fixtures/entry.json');
const spaceId = Cypress.env('spaceId');
export const entryId = 'testEntryId';

export function singleEntryResponse() {
  cy.addInteraction({
    state: 'emptyEntry',
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
  }).as('entry');
}

export function noEntryLinksResponse() {
  cy.addInteraction({
    state: 'entryLinks',
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
  }).as('entryLinks');
}

export function noEntrySnapshotsResponse() {
  cy.addInteraction({
    state: 'emptySnapshots',
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
  }).as('snapshots');
}
