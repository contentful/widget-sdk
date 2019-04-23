import * as state from '../util/interactionState';
import { getPreviewEnvironments, defaultSpaceId } from '../util/requests';

const empty = require('../fixtures/empty.json');

export function noPreviewEnvironmentsResponse() {
  const query = 'limit=100';
  cy.addInteraction({
    state: state.PreviewEnvironments.NONE,
    uponReceiving: 'a request for all preview environments',
    withRequest: getPreviewEnvironments(defaultSpaceId, query),
    willRespondWith: {
      status: 200,
      body: empty
    }
  }).as(state.PreviewEnvironments.NONE);
}
