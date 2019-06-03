import * as state from '../util/interactionState';
import {
  getEntry,
  getEntryLinks,
  getEntrySnapshots,
  defaultEntryId,
  defaultSpaceId,
  getEntriesWithEnvironment,
  defaultEnvironment
} from '../util/requests';

const empty = require('../fixtures/responses/empty.json');
const entryResponseBody = require('../fixtures/responses/entry.json');
const severalEntriesResponseBody = require('../fixtures/responses/entries-several.json');

export function singleEntryResponse() {
  cy.addInteraction({
    provider: 'entries',
    state: state.Entries.NONE,
    uponReceiving: 'a request for entry object',
    withRequest: getEntry(),
    willRespondWith: {
      status: 200,
      body: entryResponseBody
    }
  }).as(state.Entries.NONE);
}

export function noEntryLinksResponse() {
  const query = {
    links_to_entry: `${defaultEntryId}`
  };
  cy.addInteraction({
    provider: 'entries',
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
  const query = {
    limit: '7'
  };
  cy.addInteraction({
    provider: 'entries',
    state: state.Entries.SNAPSHOTS,
    uponReceiving: 'a request for entry snapshots',
    withRequest: getEntrySnapshots(defaultSpaceId, defaultEntryId, query),
    willRespondWith: {
      status: 200,
      body: empty
    }
  }).as(state.Entries.SNAPSHOTS);
}

export function singleEntryWithQuery() {
  cy.addInteraction({
    provider: 'entries',
    state: state.Entries.QUERY,
    uponReceiving: 'a request for entry with query',
    withRequest: getEntriesWithEnvironment(defaultSpaceId, defaultEnvironment, {
      'sys.id[in]': defaultEntryId
    }),
    willRespondWith: {
      status: 200,
      body: severalEntriesResponseBody
    }
  }).as(state.Entries.QUERY);
}
