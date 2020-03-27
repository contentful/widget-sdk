import { RequestOptions, Query } from '@pact-foundation/pact-web';

import { defaultSpaceId, defaultAssetId, defaultAsset, defaultHeader } from '../util/requests';

const empty = require('../fixtures/responses/empty.json');
export const severalAssetsBody = require('../fixtures/responses/assets-several.json');

enum States {
  NONE = 'assets/none',
  SEVERAL = 'assets/several',
}

const nonArchivedAssetsQuery = {
  limit: '40',
  order: '-sys.updatedAt',
  skip: '0',
  'sys.archivedAt[exists]': 'false',
};

const archivedAssetsQuery = {
  limit: '1',
  'sys.archivedAt[exists]': 'true',
};

function queryAllAssetsInTheDefaultSpaceRequest(query: Query): RequestOptions {
  return {
    method: 'GET',
    path: `/spaces/${defaultSpaceId}/assets`,
    headers: defaultHeader,
    query,
  };
}

export const queryAllNonArchivedAssetsInTheDefaultSpace = {
  willFindNone() {
    cy.addInteraction({
      provider: 'assets',
      state: States.NONE,
      uponReceiving: `a query for all non archived assets in space "${defaultSpaceId}"`,
      withRequest: queryAllAssetsInTheDefaultSpaceRequest(nonArchivedAssetsQuery),
      willRespondWith: {
        status: 200,
        body: empty,
      },
    }).as('queryAllNonArchivedAssetsInTheDefaultSpace');

    return '@queryAllNonArchivedAssetsInTheDefaultSpace';
  },
  willFindSeveral() {
    cy.addInteraction({
      provider: 'assets',
      state: States.SEVERAL,
      uponReceiving: `a query for all non archived assets in space "${defaultSpaceId}"`,
      withRequest: queryAllAssetsInTheDefaultSpaceRequest(nonArchivedAssetsQuery),
      willRespondWith: {
        status: 200,
        body: severalAssetsBody,
      },
    }).as('queryAllNonArchivedAssetsInTheDefaultSpace');

    return '@queryAllNonArchivedAssetsInTheDefaultSpace';
  },
};

export const queryAllArchivedAssetsInTheDefaultSpace = {
  willFindNone() {
    cy.addInteraction({
      provider: 'assets',
      state: 'noArchivedAssets',
      uponReceiving: `a query for all archived assets in space "${defaultSpaceId}"`,
      withRequest: queryAllAssetsInTheDefaultSpaceRequest(archivedAssetsQuery),
      willRespondWith: {
        status: 200,
        body: empty,
      },
    }).as('queryAllArchivedAssetsInTheDefaultSpace');

    return '@queryAllArchivedAssetsInTheDefaultSpace';
  },
};

export const getDefaultAssetInDefaultSpace = {
  willReturnIt() {
    cy.addInteraction({
      provider: 'assets',
      state: States.SEVERAL,
      uponReceiving: `a request to get the asset "${defaultAssetId}" in space "${defaultSpaceId}"`,
      withRequest: {
        method: 'GET',
        path: `/spaces/${defaultSpaceId}/assets/${defaultAssetId}`,
        headers: defaultHeader,
      },
      willRespondWith: {
        status: 200,
        body: defaultAsset,
      },
    }).as('getDefaultAssetInDefaultSpace');

    return '@getDefaultAssetInDefaultSpace';
  },
};
