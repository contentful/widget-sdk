import {
  defaultHeader,
  defaultEntryId,
  defaultSpaceId,
  defaultEnvironmentId,
  defaultAssetId,
  defaultContentTypeId,
  defaultEntryTestIds,
} from '../util/requests';

const empty = require('../fixtures/responses/empty.json');
import { newEntryResponse } from '../fixtures/responses/entry-new';
import { severalEntriesResponse } from '../fixtures/responses/entries-several';
import {
  severalEntryReferencesResponse,
  severalEntryReferencesWithUnresolvedResponse,
  validateEntryReferencesSeveralRequest,
  publishEntryReferencesSeveralRequest,
  validateEntryReferencesSeveralErrorsResponse,
  publishEntryReferencesSeveralErrorsResponse,
  publishEntryReferencesSeveralSuccessResponse,
  severalEntryReferencesWithVersionResponse,
} from '../fixtures/responses/entry-several-references';
import { Matchers } from '@pact-foundation/pact-web';
import { ENTRY_REFERENCES_ENDPOINT } from '../../../src/javascripts/alphaHeaders';

export enum States {
  NONE = 'entries/none',
  SEVERAL = 'entries/several',
  NO_ERRORS = 'releases/no-errors',
  VALIDATION_ERRORS = 'release/validation-errors',
  ERRORS = 'release/errors',
  SEVERAL_REFERENCES_FOR_ENTRY = 'entries/several-references',
  SEVERAL_REFERENCES_WITH_UNRESOLVED_FOR_ENTRY = 'entries/several-references-with-unresolved',
  NO_LINKS_TO_DEFAULT_ENTRY = 'entries/no-links-to-default-entry',
  NO_LINKS_TO_DEFAULT_ASSET = 'entries/no-links-to-default-asset',
  NO_SNAPSHOTS_FOR_DEFAULT_ENTRY = 'entries/no-snapshots-for-default-entry',
}

export const getDefaultEntry = {
  willReturnIt() {
    cy.addInteraction({
      provider: 'entries',
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
    }).as('getDefaultEntry');

    return '@getDefaultEntry';
  },
};

export const queryLinksToDefaultEntry = {
  willReturnNone() {
    cy.addInteraction({
      provider: 'entries',
      state: States.NO_LINKS_TO_DEFAULT_ENTRY,
      uponReceiving: `a query for links to the entry "${defaultEntryId}" in space "${defaultSpaceId}"`,
      withRequest: {
        method: 'GET',
        path: `/spaces/${defaultSpaceId}/entries`,
        headers: defaultHeader,
        query: {
          links_to_entry: `${defaultEntryId}`,
        },
      },
      willRespondWith: {
        status: 200,
        headers: {
          'Content-Type': 'application/vnd.contentful.management.v1+json',
        },
        body: empty,
      },
    }).as('queryLinksToDefaultEntry');

    return '@queryLinksToDefaultEntry';
  },
};

export const queryLinksToDefaultAsset = {
  willReturnNone() {
    cy.addInteraction({
      provider: 'entries',
      state: States.NO_LINKS_TO_DEFAULT_ASSET,
      uponReceiving: `a query for links to the asset "${defaultAssetId}" in space "${defaultSpaceId}"`,
      withRequest: {
        method: 'GET',
        path: `/spaces/${defaultSpaceId}/entries`,
        headers: defaultHeader,
        query: {
          links_to_asset: `${defaultAssetId}`,
        },
      },
      willRespondWith: {
        status: 200,
        headers: {
          'Content-Type': 'application/vnd.contentful.management.v1+json',
        },
        body: empty,
      },
    }).as('queryLinksToDefaultAsset');

    return '@queryLinksToDefaultAsset';
  },
};

export const getFirst7SnapshotsOfDefaultEntry = {
  willReturnNone() {
    cy.addInteraction({
      provider: 'entries',
      state: States.NO_SNAPSHOTS_FOR_DEFAULT_ENTRY,
      uponReceiving: `a request to get the first 7 snapshots of entry "${defaultEntryId}" in space "${defaultSpaceId}"`,
      withRequest: {
        method: 'GET',
        path: `/spaces/${defaultSpaceId}/environments/${defaultEnvironmentId}/entries/${defaultEntryId}/snapshots`,
        headers: defaultHeader,
        query: {
          limit: '7',
        },
      },
      willRespondWith: {
        status: 200,
        headers: {
          'Content-Type': 'application/vnd.contentful.management.v1+json',
        },
        body: empty,
      },
    }).as('getFirst7SnapshotsOfDefaultEntry');

    return '@getFirst7SnapshotsOfDefaultEntry';
  },
};

export const queryForDefaultEntryInsideEnvironment = {
  willFindIt() {
    cy.addInteraction({
      provider: 'entries',
      state: States.SEVERAL,
      uponReceiving: `a query for the entry "${defaultEntryId}" inside the environment "${defaultEnvironmentId}" in space "${defaultSpaceId}"`,
      withRequest: {
        method: 'GET',
        path: `/spaces/${defaultSpaceId}/environments/${defaultEnvironmentId}/entries`,
        headers: defaultHeader,
        query: {
          'sys.id[in]': defaultEntryId,
        },
      },
      willRespondWith: {
        status: 200,
        headers: {
          'Content-Type': 'application/vnd.contentful.management.v1+json',
        },
        body: {
          sys: {
            type: 'Array',
          },
          total: 1,
          skip: Matchers.integer(0),
          limit: Matchers.integer(40),
          items: [severalEntriesResponse().items[2]],
        },
      },
    }).as('queryForDefaultEntryInsideEnvironment');

    return '@queryForDefaultEntryInsideEnvironment';
  },
};

const testIds = [
  defaultEntryId,
  defaultEntryTestIds.testEntryId2,
  defaultEntryTestIds.testEntryId3,
];
export const queryForDefaultEntries = {
  willFindMultiple() {
    cy.addInteraction({
      provider: 'entries',
      state: States.SEVERAL,
      uponReceiving: `a query for the entries "${testIds.join(
        ','
      )}" inside the environment "${defaultEnvironmentId}" in space "${defaultSpaceId}"`,
      withRequest: {
        method: 'GET',
        path: `/spaces/${defaultSpaceId}/environments/${defaultEnvironmentId}/entries`,
        headers: defaultHeader,
      },
      willRespondWith: {
        status: 200,
        headers: {
          'Content-Type': 'application/vnd.contentful.management.v1+json',
        },
        body: severalEntriesResponse(),
      },
    }).as('queryForTestEntriesInsideEnvironment');

    return '@queryForTestEntriesInsideEnvironment';
  },
};

export const queryForDefaultEntryWithoutEnvironment = {
  willFindIt() {
    cy.addInteraction({
      provider: 'entries',
      state: States.SEVERAL,
      uponReceiving: `a query for the entry "${defaultEntryId}" in space "${defaultSpaceId}"`,
      withRequest: {
        method: 'GET',
        path: `/spaces/${defaultSpaceId}/entries`,
        headers: defaultHeader,
        query: {
          'sys.id[in]': defaultEntryId,
        },
      },
      willRespondWith: {
        status: 200,
        headers: {
          'Content-Type': 'application/vnd.contentful.management.v1+json',
        },
        body: {
          sys: {
            type: 'Array',
          },
          total: 1,
          skip: Matchers.integer(0),
          limit: Matchers.integer(40),
          items: [severalEntriesResponse().items[2]],
        },
      },
    }).as('queryForDefaultEntryWithoutEnvironment');

    return '@queryForDefaultEntryWithoutEnvironment';
  },
};

export const createAnEntryInDefaultSpace = {
  willSucceed() {
    cy.addInteraction({
      provider: 'entries',
      state: States.NONE,
      uponReceiving: `a request to create an entry in "${defaultSpaceId}"`,
      withRequest: {
        method: 'POST',
        path: `/spaces/${defaultSpaceId}/entries`,
        headers: {
          ...defaultHeader,
          'X-Contentful-Content-Type': defaultContentTypeId,
        },
        body: {},
      },
      willRespondWith: {
        status: 201,
        headers: {
          'Content-Type': 'application/vnd.contentful.management.v1+json',
        },
        body: newEntryResponse(),
      },
    }).as('createAnEntryInDefaultSpace');

    return '@createAnEntryInDefaultSpace';
  },
};

export const validateAnEntryValidResponse = {
  willSucceed() {
    const version = String(severalEntriesResponse().items[2].sys.version.getValue());
    cy.addInteraction({
      provider: 'entries',
      state: States.SEVERAL,
      uponReceiving: `a request to validate an entry in "${defaultSpaceId}"`,
      withRequest: {
        method: 'PUT',
        path: `/spaces/${defaultSpaceId}/environments/${defaultEnvironmentId}/entries/${defaultEntryId}/published`,
        headers: {
          ...defaultHeader,
          'X-Contentful-Version': version,
        },
      },
      willRespondWith: {
        status: 200,
        headers: {
          'Content-Type': 'application/vnd.contentful.management.v1+json',
        },
      },
    }).as('validateAnEntryValidResponse');

    return '@validateAnEntryValidResponse';
  },
};

export const getEntryReferences = {
  willReturnSeveral() {
    cy.addInteraction({
      provider: 'entries',
      state: States.SEVERAL_REFERENCES_FOR_ENTRY,
      uponReceiving: `get references for entry "${defaultEntryId}" in space "${defaultSpaceId}"`,
      withRequest: {
        method: 'GET',
        path: `/spaces/${defaultSpaceId}/environments/${defaultEnvironmentId}/entries/${defaultEntryId}/references`,
        headers: {
          ...defaultHeader,
          'X-Contentful-Enable-Alpha-Feature': ENTRY_REFERENCES_ENDPOINT,
        },
      },
      willRespondWith: {
        status: 200,
        headers: {
          'Content-Type': 'application/vnd.contentful.management.v1+json',
        },
        body: severalEntryReferencesResponse,
      },
    }).as('getEntryReferences');

    return '@getEntryReferences';
  },
  willReturnSeveralWithVersion() {
    cy.addInteraction({
      provider: 'entries',
      state: States.SEVERAL_REFERENCES_FOR_ENTRY,
      uponReceiving: `get versioned references for entry "${defaultEntryId}" in space "${defaultSpaceId}"`,
      withRequest: {
        method: 'GET',
        path: `/spaces/${defaultSpaceId}/environments/${defaultEnvironmentId}/entries/${defaultEntryId}/references`,
        headers: {
          ...defaultHeader,
          'X-Contentful-Enable-Alpha-Feature': ENTRY_REFERENCES_ENDPOINT,
        },
      },
      willRespondWith: {
        status: 200,
        headers: {
          'Content-Type': 'application/vnd.contentful.management.v1+json',
        },
        body: severalEntryReferencesWithVersionResponse,
      },
    }).as('getVersionedEntryReferences');

    return '@getVersionedEntryReferences';
  },
  willReturnSeveralWithUnresolved() {
    cy.addInteraction({
      provider: 'entries',
      state: States.SEVERAL_REFERENCES_WITH_UNRESOLVED_FOR_ENTRY,
      uponReceiving: `get references, including unresolved, for entry "${defaultEntryId}" in space "${defaultSpaceId}"`,
      withRequest: {
        method: 'GET',
        path: `/spaces/${defaultSpaceId}/environments/${defaultEnvironmentId}/entries/${defaultEntryId}/references`,
        headers: {
          ...defaultHeader,
          'X-Contentful-Enable-Alpha-Feature': ENTRY_REFERENCES_ENDPOINT,
        },
      },
      willRespondWith: {
        status: 200,
        headers: {
          'Content-Type': 'application/vnd.contentful.management.v1+json',
        },
        body: severalEntryReferencesWithUnresolvedResponse,
      },
    }).as('getEntryReferencesWithUnresolved');

    return '@getEntryReferencesWithUnresolved';
  },
};

export const validateEntryReferencesResponse = {
  willReturnNoErrors() {
    cy.addInteraction({
      provider: 'releases',
      state: States.NO_ERRORS,
      uponReceiving: `validate references for entry "${defaultEntryId}" in space "${defaultSpaceId}"`,
      withRequest: {
        method: 'POST',
        path: `/spaces/${defaultSpaceId}/environments/${defaultEnvironmentId}/releases/immediate/validations`,
        headers: {
          ...defaultHeader,
          'x-contentful-enable-alpha-feature': 'immediate-release',
        },
        body: validateEntryReferencesSeveralRequest,
      },
      willRespondWith: {
        status: 200,
        headers: {
          'Content-Type': 'application/vnd.contentful.management.v1+json',
        },
        body: {
          sys: {
            id: 'immediate',
            type: 'ReleaseValidation',
          },
          errored: [],
        },
      },
    }).as('validateEntryReferencesResponse');

    return '@validateEntryReferencesResponse';
  },

  willReturnErrors() {
    cy.addInteraction({
      provider: 'releases',
      state: States.VALIDATION_ERRORS,
      uponReceiving: `validate references for entry "${defaultEntryId}" in space "${defaultSpaceId}"`,
      withRequest: {
        method: 'POST',
        path: `/spaces/${defaultSpaceId}/environments/${defaultEnvironmentId}/releases/immediate/validations`,
        headers: {
          ...defaultHeader,
          'x-contentful-enable-alpha-feature': 'immediate-release',
        },
        body: validateEntryReferencesSeveralRequest,
      },
      willRespondWith: {
        status: 200,
        headers: {
          'Content-Type': 'application/vnd.contentful.management.v1+json',
        },
        body: validateEntryReferencesSeveralErrorsResponse,
      },
    }).as('validateEntryReferencesResponse');

    return '@validateEntryReferencesResponse';
  },
};

export const publishEntryReferencesResponse = {
  willReturnNoErrors() {
    cy.addInteraction({
      provider: 'releases',
      state: States.NO_ERRORS,
      uponReceiving: `publish references for entry "${defaultEntryId}" in space "${defaultSpaceId}"`,
      withRequest: {
        method: 'POST',
        path: `/spaces/${defaultSpaceId}/environments/${defaultEnvironmentId}/releases/immediate/execute`,
        headers: {
          ...defaultHeader,
          'x-contentful-enable-alpha-feature': 'immediate-release',
        },
        body: publishEntryReferencesSeveralRequest,
      },
      willRespondWith: {
        status: 200,
        headers: {
          'Content-Type': 'application/vnd.contentful.management.v1+json',
        },
        body: publishEntryReferencesSeveralSuccessResponse,
      },
    }).as('publishEntryReferencesResponse');

    return '@publishEntryReferencesResponse';
  },

  willReturnErrors() {
    cy.addInteraction({
      provider: 'releases',
      state: States.VALIDATION_ERRORS,
      uponReceiving: `fail publishing references for entry "${defaultEntryId}" in space "${defaultSpaceId}" with validation error`,
      withRequest: {
        method: 'POST',
        path: `/spaces/${defaultSpaceId}/environments/${defaultEnvironmentId}/releases/immediate/execute`,
        headers: {
          ...defaultHeader,
          'x-contentful-enable-alpha-feature': 'immediate-release',
        },
        body: publishEntryReferencesSeveralRequest,
      },
      willRespondWith: {
        status: 422,
        headers: {
          'Content-Type': 'application/vnd.contentful.management.v1+json',
        },
        body: publishEntryReferencesSeveralErrorsResponse,
      },
    }).as('publishEntryReferencesResponse');

    return '@publishEntryReferencesResponse';
  },

  willFail() {
    cy.addInteraction({
      provider: 'releases',
      state: States.ERRORS,
      uponReceiving: `fail publishing references for entry "${defaultEntryId}" in space "${defaultSpaceId}"`,
      withRequest: {
        method: 'POST',
        path: `/spaces/${defaultSpaceId}/environments/${defaultEnvironmentId}/releases/immediate/execute`,
        headers: {
          ...defaultHeader,
          'x-contentful-enable-alpha-feature': 'immediate-release',
        },
        body: null,
      },
      willRespondWith: {
        status: 400,
        headers: {
          'Content-Type': 'application/vnd.contentful.management.v1+json',
        },
        body: {
          sys: {
            id: 'immediate',
            type: 'ReleaseValidation',
          },
          errored: [
            {
              sys: {
                type: 'Link',
                linkType: 'Entry',
                id: defaultEntryId,
              },
              error: {
                sys: {
                  type: 'Error',
                  id: 'InvalidEntry',
                },
                message: 'Validation error',
                details: {
                  errors: [
                    {
                      name: 'required',
                      path: ['fields', 'requiredText'],
                      details: 'The property "requiredText" is required here',
                    },
                  ],
                },
              },
            },
          ],
        },
      },
    }).as('validateEntryReferencesResponse');

    return '@validateEntryReferencesResponse';
  },
};
