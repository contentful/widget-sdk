import {
  defaultHeader,
  defaultEntryId,
  defaultEntry,
  defaultSpaceId,
  defaultEnvironmentId,
  defaultAssetId,
} from '../util/requests';

const empty = require('../fixtures/responses/empty.json');
const severalEntriesResponseBody = require('../fixtures/responses/entries-several.json');
import {
  severalEntryReferencesResponse,
  validateEntryReferencesSeveralRequest,
  publishEntryReferencesSeveralRequest,
  validateEntryReferencesSeveralErrorsResponse,
  publishEntryReferencesSeveralErrorsResponse,
  publishEntryReferencesSeveralSuccessResponse,
} from '../fixtures/responses/entry-several-references';

enum States {
  NONE = 'entries/none',
  SEVERAL = 'entries/several',
  NO_ERRORS = 'releases/no-errors',
  VALIDATION_ERRORS = 'release/validation-errors',
  ERRORS = 'release/errors',
  SEVERAL_REFERENCES_FOR_ENTRY = 'entries/several-references',
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
        body: defaultEntry,
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
        path: `/spaces/${defaultSpaceId}/entries/${defaultEntryId}/snapshots`,
        headers: defaultHeader,
        query: {
          limit: '7',
        },
      },
      willRespondWith: {
        status: 200,
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
      // TODO: Is this description accurate?
      uponReceiving: `a query for the entry "${defaultEntryId}" inside the environment "${defaultEnvironmentId}" in space "${defaultSpaceId}"`,
      withRequest: {
        method: 'GET',
        path: `/spaces/${defaultSpaceId}/environments/${defaultEnvironmentId}/entries`,
        headers: defaultHeader,
        query: {
          'sys.id[in]': defaultEntryId, // TODO: Is this the correct query?
        },
      },
      willRespondWith: {
        status: 200,
        body: severalEntriesResponseBody, // TODO: This looks wrong (the response contains three entries)
      },
    }).as('queryForDefaultEntryInsideEnvironment');

    return '@queryForDefaultEntryInsideEnvironment';
  },
};

export const queryForDefaultEntryWithoutEnvironment = {
  willFindIt() {
    cy.addInteraction({
      provider: 'entries',
      state: States.SEVERAL,
      // TODO: Is this description accurate?
      uponReceiving: `a query for the entry "${defaultEntryId}"  in space "${defaultSpaceId}"`,
      withRequest: {
        method: 'GET',
        path: `/spaces/${defaultSpaceId}/entries`,
        headers: defaultHeader,
        query: {
          'sys.id[in]': defaultEntryId, // TODO: Is this the correct query?
        },
      },
      willRespondWith: {
        status: 200,
        body: severalEntriesResponseBody, // TODO: This looks wrong (the response contains three entries)
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
        headers: defaultHeader,
      },
      willRespondWith: {
        status: 201,
        body: defaultEntry,
      },
    }).as('createAnEntryInDefaultSpace');

    return '@createAnEntryInDefaultSpace';
  },
};

export const validateAnEntryValidResponse = {
  willSucceed() {
    cy.addInteraction({
      provider: 'entries',
      state: States.NONE,
      uponReceiving: `a request to validate an entry in "${defaultSpaceId}"`,
      withRequest: {
        method: 'PUT',
        path: `/spaces/${defaultSpaceId}/environments/${defaultEnvironmentId}/entries/${defaultEntryId}/published`,
        headers: defaultHeader,
      },
      willRespondWith: {
        status: 200,
      },
    }).as('createAnEntryInDefaultSpace');

    return '@createAnEntryInDefaultSpace';
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
        headers: defaultHeader,
      },
      willRespondWith: {
        status: 200,
        body: severalEntryReferencesResponse,
      },
    }).as('getEntryReferences');

    return '@getEntryReferences';
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
