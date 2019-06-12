# Testing with Cypress

## Table of Contents

- About Cypress
- Running tests
- Writing tests

## About the tool

Cypress is a next generation front end testing tool built for the modern web.
We are using it for integration testing, contract testing and end-to-end testing.

More about the tool [here](https://docs.cypress.io/guides/overview/why-cypress.html#In-a-nutshell)

## Running tests

Make sure that your local app is running with localhost ui config, example: `UI_CONFIG=localhost npm start`

```bash
# Run the tests in a headless mode
npx cypress run
```

```bash
# Run the tests in interactive mode (useful for debugging)
npx cypress open
# This will open Cypress console, where you can select the spec you need
```

```bash
# Run the tests in interactive mode. Delete folders Logs/ and Pacts/ before running.
npm run cypress
# This will open Cypress console, where you can select the spec you need. Folders logs/ and pacts/ will be deleted (we use pactfileWriteMode: ‘merge’ and any existing pacts should be deleted before running the tests).
```

```bash
# Run a specific test
npx cypress run --spec "<path-a-spec-file>"
```

## Writing tests

There many ways you can write a test using Cypress. With the current project we will be focusing on using Cypress for writing UI Blackbox contract tests.

### Contract tests with [PACT](https://docs.pact.io/)

The idea is to mock all API requests that the app does with a responses based on a contract provided by the API endpoint.

Example of a mock using PACT via [cypress-pact](https://github.com/contentful/cypress-pact) tool. If the test running this mock was sucessful, PACT will store the contract used for this mock in `pacts` directory:

```javascript
  cy.addInteraction({
    state: 'noPublicContentTypes',
    uponReceiving: 'a request for all public content types',
    withRequest: {
      method: 'GET',
      path: `/spaces/${spaceId}/public/content_types`,
      headers: {
        Accept: 'application/json, text/plain, */*'
      },
      query: 'limit=1000'
    },
    willRespondWith: {
      status: 200,
      body: {
        "total": 0,
        "sys": {
          "type": "Array"
        },
        "items": []
      }
    }
  }).as('publicContentTypes');
}
```

In this example we have a simple description of the request and the response. By assigning alias `as('publicContentTypes')` the request will be highlighted with this name in the Cypress console which makes it easier to debug.

NOTE: `query` is important. If you ignore the query that app sends Cypress won't mock the request.

All general mocks are stored in `test/cypress/mocks`.

Complex response bodies for the requests are stored in `test/cypress/fixtures`.

If you are mocking a request that is unique for your test, you should keep it in your spec file.

A complete test example:

```javascript
import { tokenRequestAlias, validTokenResponse } from '../../mocks/token';
import { noEnforcementsResponse } from '../../mocks/enforcements';
import { noPublicContentTypesResponse } from '../../mocks/content_types';
import { masterEnvironmentResponse } from '../../mocks/environments';
import { freePlanResponse } from '../../mocks/plans';
import { defaultLocaleResponse } from '../../mocks/locales';
import { productCatalogFeaturesResponse } from '../../mocks/product_catalog_features';
import { emptyUiConfigResponse, uiConfigMeResponse } from '../../mocks/ui_config';
import {
  noPreviewEnvironmentsAlias,
  noPreviewEnvironmentsResponse
} from '../../mocks/preview_environments';

const spaceId = Cypress.env('spaceId');
const empty = require('../../fixtures/empty.json');

describe('Content types list page', () => {
  before(() => {
    cy.setAuthTokenToLocalStorage();
    validTokenResponse();
    noEnforcementsResponse();
    noPublicContentTypesResponse();
    masterEnvironmentResponse();
    freePlanResponse();
    defaultLocaleResponse();
    productCatalogFeaturesResponse();
    emptyUiConfigResponse();
    uiConfigMeResponse();
    noPreviewEnvironmentsResponse();

    cy.addInteraction({
      state: 'noContentTypesWithQuery',
      uponReceiving: 'a request for all content types',
      withRequest: {
        method: 'GET',
        path: `/spaces/${spaceId}/content_types`,
        headers: {
          Accept: 'application/json, text/plain, */*'
        },
        query: 'limit=1000&order=name'
      },
      willRespondWith: {
        status: 200,
        body: empty
      }
    }).as('noContentTypes');
    cy.visit(`/spaces/${spaceId}/content_types`);
    cy.wait([`@${tokenRequestAlias}`, `@${noPreviewEnvironmentsAlias}`]);
  });
  describe('Opening the page with no content types', () => {
    it('Renders the page', () => {
      cy.getByTestId('create-content-type-empty-state')
        .should('be.visible')
        .should('be.enabled');
    });
    it('Shows no content type advice', () => {
      cy.getByTestId('no-content-type-advice').should('be.visible');
    });
    it('Add content type button redirects correctly', () => {
      cy.addInteraction({
        state: 'noExtensions',
        uponReceiving: 'a request for all extensions',
        withRequest: {
          method: 'GET',
          path: `/spaces/${spaceId}/environments/master/extensions`,
          headers: {
            Accept: 'application/json, text/plain, */*'
          }
        },
        willRespondWith: {
          status: 200,
          body: empty
        }
      }).as('noExtensions');
      cy.addInteraction({
        state: 'noContentTypes',
        uponReceiving: 'a request for all content types',
        withRequest: {
          method: 'GET',
          path: `/spaces/${spaceId}/content_types`,
          headers: {
            Accept: 'application/json, text/plain, */*'
          }
        },
        willRespondWith: {
          status: 200,
          body: empty
        }
      }).as('noContentTypes');
      cy.getByTestId('create-content-type-empty-state').click();
      cy.url().should('contain', '/content_types_new/fields');
    });
  });
});
```
