import * as state from '../util/interactionState';
import { getAssets, defaultSpaceId } from '../util/requests';

const empty = require('../fixtures/empty.json');
export const severalAssetsBody = require('../fixtures/assets-several.json');
const query = {
  limit: '40',
  order: '-sys.updatedAt',
  skip: '0',
  'sys.archivedAt[exists]': 'false'
};
const archivedQuery = {
  limit: '1',
  'sys.archivedAt[exists]': 'true'
};

export function noAssetsResponse() {
  cy.addInteraction({
    provider: 'assets',
    state: state.Assets.NONE,
    uponReceiving: 'a request for assets in the space',
    withRequest: getAssets(defaultSpaceId, query),
    willRespondWith: {
      status: 200,
      body: empty
    }
  }).as(state.Assets.NONE);
}

export function noArchivedAssetsResponse() {
  cy.addInteraction({
    provider: 'assets',
    state: 'noArchivedAssets',
    uponReceiving: 'a request for archived assets in the space',
    withRequest: getAssets(defaultSpaceId, archivedQuery),
    willRespondWith: {
      status: 200,
      body: empty
    }
  }).as('assets/archived-none');
}

export function severalAssetsResponse() {
  cy.addInteraction({
    provider: 'assets',
    state: state.Assets.SEVERAL,
    uponReceiving: 'a request for assets in the space',
    withRequest: getAssets(defaultSpaceId, query),
    willRespondWith: {
      status: 200,
      body: severalAssetsBody
    }
  }).as(state.Assets.SEVERAL);
}
