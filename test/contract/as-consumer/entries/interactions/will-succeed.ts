import { InteractionObject } from '@pact-foundation/pact';
import { defaultEntryId, defaultHeader, defaultSpaceId } from '../../../../cypress/util/requests';
import { severalEntriesResponse } from '../../../../cypress/fixtures/responses/entries-several';
import { States } from '../../../../cypress/interactions/entries';

// TODO: cypress's "willReturnIt" should simply import from and return this
// (with added "provider: entries" property).
//
// Need to find a smart way to namespace the shared stuff though, because
// this file imports a lot from the Cypress folders, too
export const willSucceedGettingDefaultEntry = (): InteractionObject => ({
  state: States.SEVERAL,
  uponReceiving: `a request for the entry "${defaultEntryId}" in space "${defaultSpaceId}" with the EntityRepo`,
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
});

export const willSucceedPatchingDefaultEntry = (): InteractionObject => {
  const defaultEntry = severalEntriesResponse().items[2];
  return {
    state: States.SEVERAL,
    uponReceiving: `a request to update the entry "${defaultEntryId}" in space "${defaultSpaceId}" with the EntityRepo`,
    withRequest: {
      method: 'PATCH',
      path: `/spaces/${defaultSpaceId}/entries/${defaultEntryId}`,
      headers: {
        ...defaultHeader,
        'Content-Type': 'application/json-patch+json',
      },
      body: [
        {
          op: 'add',
          path: '/fields/fieldId',
          value: { 'en-US': 'updated-field-id' },
        },
      ],
    },
    willRespondWith: {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.contentful.management.v1+json',
        'Accept-Patch': 'application/json-patch+json',
      },
      body: {
        ...defaultEntry,
        sys: {
          ...defaultEntry.sys,
          version: 2,
        },
        fields: {
          ...defaultEntry.fields,
          fieldId: { 'en-US': 'updated-field-id' },
        },
      },
    },
  };
};
