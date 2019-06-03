import * as state from '../util/interactionState';
import { getExtensions } from '../util/requests';

const empty = require('../fixtures/responses/empty.json');

export function noExtensionsResponse() {
  return cy
    .addInteraction({
      provider: 'extensions',
      state: state.Extensions.NONE,
      uponReceiving: 'a request for all extensions',
      withRequest: getExtensions(),
      willRespondWith: {
        status: 200,
        body: empty
      }
    })
    .as(state.Extensions.NONE);
}
