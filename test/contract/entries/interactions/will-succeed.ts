import { InteractionObject } from '@pact-foundation/pact';
import { defaultEntryId, defaultHeader, defaultSpaceId } from '../../../cypress/util/requests';
import { severalEntriesResponse } from '../../../cypress/fixtures/responses/entries-several';
import { States } from '../../../cypress/interactions/entries';

// TODO: cypress's "willReturnIt" should simply import from and return this
// (with added "provider: entries" property).
//
// Need to find a smart way to namespace the shared stuff though, because
// this file imports a lot from the Cypress folders, too
export const willSucceedGettingDefaultEntry: InteractionObject = {
  state: States.SEVERAL,
  uponReceiving: `a request for the entry "${defaultEntryId}" in space "${defaultSpaceId}"`,
  withRequest: {
    method: 'GET',
    path: `/spaces/${defaultSpaceId}/entries/${defaultEntryId}`,
    headers: defaultHeader,
  },
  willRespondWith: {
    status: 200,
    headers: {
      'Content-Type': 'application/vnd.contentful.management.v1+json',
    },
    body: severalEntriesResponse().items[2],
  },
};
