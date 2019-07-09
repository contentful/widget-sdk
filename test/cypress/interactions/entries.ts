import * as state from '../util/interactionState';
import {
  getEntry,
  getEntryLinks,
  getEntrySnapshots,
  defaultEntryId,
  defaultEntry,
  defaultSpaceId,
  getEntriesWithEnvironment,
  defaultEnvironment,
  defaultAssetId,
  postEntry
} from '../util/requests';

const empty = require('../fixtures/responses/empty.json');
const severalEntriesResponseBody = require('../fixtures/responses/entries-several.json');

export function singleEntryResponse() {
  cy.addInteraction({
    provider: 'entries',
    state: state.Entries.SEVERAL,
    uponReceiving: 'a request for the default entry',
    withRequest: getEntry(),
    willRespondWith: {
      status: 200,
      body: defaultEntry
    }
  }).as(state.Entries.SEVERAL);
}

export function noEntryLinksResponse() {
  const query = {
    links_to_entry: `${defaultEntryId}`
  };
  cy.addInteraction({
    provider: 'entries',
    state: state.Entries.NO_LINKS_TO_DEFAULT_ENTRY,
    uponReceiving: 'a query for links to the default entry',
    withRequest: getEntryLinks(defaultSpaceId, query),
    willRespondWith: {
      status: 200,
      body: empty
    }
  }).as(state.Entries.NO_LINKS_TO_DEFAULT_ENTRY);
}

export function noAssetLinksResponse() {
  const query = {
    links_to_asset: `${defaultAssetId}`
  };
  cy.addInteraction({
    provider: 'entries',
    state: state.Entries.NO_LINKS_TO_DEFAULT_ASSET,
    uponReceiving: 'a query for links to the default asset',
    withRequest: getEntryLinks(defaultSpaceId, query),
    willRespondWith: {
      status: 200,
      body: empty
    }
  }).as(state.Entries.NO_LINKS_TO_DEFAULT_ASSET);
}

export function noEntrySnapshotsResponse() {
  const query = {
    limit: '7'
  };
  cy.addInteraction({
    provider: 'entries',
    state: state.Entries.NO_SNAPSHOTS_FOR_DEFAULT_ENTRY,
    uponReceiving: 'a request for entry snapshots',
    withRequest: getEntrySnapshots(defaultSpaceId, defaultEntryId, query),
    willRespondWith: {
      status: 200,
      body: empty
    }
  }).as(state.Entries.NO_SNAPSHOTS_FOR_DEFAULT_ENTRY);
}

export function singleEntryWithQuery() {
  cy.addInteraction({
    provider: 'entries',
    state: state.Entries.SEVERAL,
    uponReceiving: 'a request for entry with query',
    withRequest: getEntriesWithEnvironment(defaultSpaceId, defaultEnvironment, {
      'sys.id[in]': defaultEntryId
    }),
    willRespondWith: {
      status: 200,
      body: severalEntriesResponseBody
    }
  }).as(state.Entries.SEVERAL);
}

export function postSingleEntryRequest() {
  cy.addInteraction({
    provider: 'entries',
    state: state.Entries.NONE,
    uponReceiving: 'post request for entry',
    withRequest: postEntry(),
    willRespondWith: {
      status: 201,
      body: defaultEntry
    }
  }).as(state.Entries.NONE);
}
