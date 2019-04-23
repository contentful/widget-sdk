import * as state from '../util/interactionState';
import {
  getEntry,
  getEntryLinks,
  getEntrySnapshots,
  defaultEntryId,
  defaultSpaceId
} from '../util/requests';

const empty = require('../fixtures/empty.json');
const entryResponseBody = require('../fixtures/entry.json');

export function singleEntryResponse() {
  cy.addInteraction({
    state: state.Entries.EMPTY,
    uponReceiving: 'a request for entry object',
    withRequest: getEntry(),
    willRespondWith: {
      status: 200,
      body: entryResponseBody
    }
  }).as(state.Entries.EMPTY);
}

export function noEntryLinksResponse() {
  const query = `links_to_entry=${defaultEntryId}`;
  cy.addInteraction({
    state: state.Entries.LINKS,
    uponReceiving: 'a request for entry links',
    withRequest: getEntryLinks(defaultSpaceId, query),
    willRespondWith: {
      status: 200,
      body: empty
    }
  }).as(state.Entries.LINKS);
}

export function noEntrySnapshotsResponse() {
  const query = 'limit=7';
  cy.addInteraction({
    state: state.Entries.SNAPSHOTS,
    uponReceiving: 'a request for entry snapshots',
    withRequest: getEntrySnapshots(defaultSpaceId, defaultEntryId, query),
    willRespondWith: {
      status: 200,
      body: empty
    }
  }).as(state.Entries.SNAPSHOTS);
}
