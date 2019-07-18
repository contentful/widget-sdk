import * as state from '../util/interactionState';
import {
  defaultHeader,
  defaultEntryId,
  defaultEntry,
  defaultSpaceId,
  defaultEnvironmentId,
  defaultAssetId
} from '../util/requests';

const empty = require('../fixtures/responses/empty.json');
const severalEntriesResponseBody = require('../fixtures/responses/entries-several.json');

export const getDefaultEntry = {
  willReturnIt() {
    return cy.addInteraction({
      provider: 'entries',
      state: state.Entries.SEVERAL,
      uponReceiving: `a request for the entry "${defaultEntryId}" in space "${defaultSpaceId}"`,
      withRequest: {
        method: 'GET',
        path: `/spaces/${defaultSpaceId}/entries/${defaultEntryId}`,
        headers: defaultHeader
      },
      willRespondWith: {
        status: 200,
        body: defaultEntry
      }
    }).as(state.Entries.SEVERAL);
  }
};

export const queryLinksToDefaultEntry = {
  willReturnNone() {
    return cy.addInteraction({
      provider: 'entries',
      state: state.Entries.NO_LINKS_TO_DEFAULT_ENTRY,
      uponReceiving: `a query for links to the entry "${defaultEntryId}" in space "${defaultSpaceId}"`,
      withRequest: {
        method: 'GET',
        path: `/spaces/${defaultSpaceId}/entries`,
        headers: defaultHeader,
        query: {
          links_to_entry: `${defaultEntryId}`
        }
      },
      willRespondWith: {
        status: 200,
        body: empty
      }
    }).as(state.Entries.NO_LINKS_TO_DEFAULT_ENTRY);
  }
};

export const queryLinksToDefaultAsset = {
  willReturnNone() {
    return cy.addInteraction({
      provider: 'entries',
      state: state.Entries.NO_LINKS_TO_DEFAULT_ASSET,
      uponReceiving: `a query for links to the asset "${defaultAssetId}" in space "${defaultSpaceId}"`,
      withRequest: {
        method: 'GET',
        path: `/spaces/${defaultSpaceId}/entries`,
        headers: defaultHeader,
        query: {
          links_to_asset: `${defaultAssetId}`
        }
      },
      willRespondWith: {
        status: 200,
        body: empty
      }
    }).as(state.Entries.NO_LINKS_TO_DEFAULT_ASSET);
  }
};

export const getFirst7SnapshotsOfDefaultEntry = {
  willReturnNone() {
    return cy.addInteraction({
      provider: 'entries',
      state: state.Entries.NO_SNAPSHOTS_FOR_DEFAULT_ENTRY,
      uponReceiving: `a request to get the first 7 snapshots of entry "${defaultEntryId}" in space "${defaultSpaceId}"`,
      withRequest: {
        method: 'GET',
        path: `/spaces/${defaultSpaceId}/entries/${defaultEntryId}/snapshots`,
        headers: defaultHeader,
        query: {
          limit: '7'
        }
      },
      willRespondWith: {
        status: 200,
        body: empty
      }
    }).as(state.Entries.NO_SNAPSHOTS_FOR_DEFAULT_ENTRY);
  }
};

export const queryForDefaultEntryInsideEnvironment ={
  willFindIt() {
    return cy.addInteraction({
      provider: 'entries',
      state: state.Entries.SEVERAL,
      // TODO: Is this description accurate?
      uponReceiving: `a query for the entry "${defaultEntryId}" inside the environment "${defaultEnvironmentId}" in space "${defaultSpaceId}"`,
      withRequest: {
        method: 'GET',
        path: `/spaces/${defaultSpaceId}/environments/${defaultEnvironmentId}/entries`,
        headers: defaultHeader,
        query: {
          'sys.id[in]': defaultEntryId // TODO: Is this the correct query?
        }
      },
      willRespondWith: {
        status: 200,
        body: severalEntriesResponseBody // TODO: This looks wrong (the response contains three entries)
      }
    }).as(state.Entries.SEVERAL);
  }
};

export const createAnEntryInDefaultSpace = {
  willSucceed() {
    return cy.addInteraction({
      provider: 'entries',
      state: state.Entries.NONE,
      uponReceiving: `a request to create an entry in "${defaultSpaceId}"`,
      withRequest: {
        method: 'POST',
        path: `/spaces/${defaultSpaceId}/entries`,
        headers: defaultHeader
      },
      willRespondWith: {
        status: 201,
        body: defaultEntry
      }
    }).as(state.Entries.NONE);
  }
}
