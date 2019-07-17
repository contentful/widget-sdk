import * as state from '../util/interactionState';
import {
  defaultHeader,
  defaultSpaceId,
  defaultWebhookId
} from '../util/requests';
import { RequestOptions } from '@pact-foundation/pact-web';

const empty = require('../fixtures/responses/empty.json');
const defaultWebhookRequestBody = require('../fixtures/requests/webhooks/default-webhook.json');
const defaultWebhookResponseBody = require('../fixtures/responses/webhooks/default-webhook.json');
const webhookSingleEventResponseBody = require('../fixtures/responses/webhooks/webhook-single-event.json');
const webhookSuccessfulCallResponseBody = require('../fixtures/responses/webhooks/webhook-call-successful.json');
const singleWebhookResponseBody = require('../fixtures/responses/webhooks/single-webhook.json');
const noWebhookCallsResponseBody = require('../fixtures/responses/webhooks/no-webhook-calls.json');
const webhookCustomAllSettingsResponseBody = require('../fixtures/responses/webhooks/custom-webhook.json');
const customWebhookContentTypeEventsRequestBody = require('../fixtures/requests/webhooks/custom-webhook-ct-events.json');
const customWebhookContentTypeEventsResponseBody = require('../fixtures/responses/webhooks/custom-webhook-ct-events.json');
const customWebhookFilterRequestBody = require('../fixtures/requests/webhooks/custom-webhook-filter.json');
const customWebhookFilterResponseBody = require('../fixtures/responses/webhooks/custom-webhook-filter.json');
const customWebhookHeaderRequestBody = require('../fixtures/requests/webhooks/custom-webhook-header.json');
const customWebhookHeaderResponseBody = require('../fixtures/responses/webhooks/custom-webhook-header.json');
const customWebhookSecretHeaderRequestBody = require('../fixtures/requests/webhooks/custom-webhook-secret-header.json');
const customWebhookSecretHeaderResponseBody = require('../fixtures/responses/webhooks/custom-webhook-secret-header.json');
const customWebhookHTTPRequestBody = require('../fixtures/requests/webhooks/custom-webhook-http-header.json');
const customWebhookHTTPResponseBody = require('../fixtures/responses/webhooks/custom-webhook-http-header.json');
const customWebhookContentTypeHeaderRequestBody = require('../fixtures/requests/webhooks/custom-webhook-ct-header.json');
const customWebhookContentTypeHeaderResponseBody = require('../fixtures/responses/webhooks/custom-webhook-ct-header.json');
const customWebhookContentLengthHeaderRequestBody = require('../fixtures/requests/webhooks/custom-webhook-content-length-header.json');
const customWebhookContentLengthHeaderResponseBody = require('../fixtures/responses/webhooks/custom-webhook-content-length-header.json');
const customWebhookPayloadRequestBody = require('../fixtures/requests/webhooks/custom-webhook-payload.json');
const customWebhookPayloadResponseBody = require('../fixtures/responses/webhooks/custom-webhook-payload.json');

const queryFirst100WebhooksInDefaultSpaceRequest: RequestOptions = {
  method: 'GET',
  path: `/spaces/${defaultSpaceId}/webhook_definitions`,
  headers: defaultHeader,
  query: {
    limit: '100'
  }
};

export const queryFirst100WebhooksInDefaultSpace = {
  willFindNone() {
    return cy.addInteraction({
      provider: 'webhooks',
      state: state.Webhooks.NONE,
      uponReceiving: `a query for the first 100 webhooks in space "${defaultSpaceId}"`,
      withRequest: queryFirst100WebhooksInDefaultSpaceRequest,
      willRespondWith: {
        status: 200,
        body: empty
      }
    }).as(state.Webhooks.NONE);
  },
  willFindOne() {
    return cy.addInteraction({
      provider: 'webhooks',
      state: state.Webhooks.SINGLE,
      uponReceiving: `a query for the first 100 webhooks in space "${defaultSpaceId}"`,
      withRequest: queryFirst100WebhooksInDefaultSpaceRequest,
      willRespondWith: {
        status: 200,
        body: singleWebhookResponseBody
      }
    }).as(state.Webhooks.SINGLE);
  },
  willFailWithInternalServerError() {
    return cy.addInteraction({
      provider: 'webhooks',
      state: state.Webhooks.INTERNAL_SERVER_ERROR,
      uponReceiving: `a query for the first 100 webhooks in space "${defaultSpaceId}"`,
      withRequest: queryFirst100WebhooksInDefaultSpaceRequest,
      willRespondWith: {
        status: 500,
        body: empty
      }
    }).as(state.Webhooks.INTERNAL_SERVER_ERROR);
  }
}

function createWebhookInDefaultSpaceRequest(body: Object): RequestOptions {
  return {
    method: 'POST',
    path: `/spaces/${defaultSpaceId}/webhook_definitions`,
    headers: defaultHeader,
    body
  };
}

export const createDefaultWebhook = {
  willSucceed() {
    cy.addInteraction({
      provider: 'webhooks',
      state: state.Webhooks.NONE,
      uponReceiving: `a request to create default webhook in space "${defaultSpaceId}"`,
      withRequest: createWebhookInDefaultSpaceRequest(defaultWebhookRequestBody),
      willRespondWith: {
        status: 200,
        body: defaultWebhookResponseBody
      }
    }).as('default-webhook-created-successfully');
  }
}

export const createCustomWebhookTriggeringContentTypeEvents = {
  willSucceed() {
    cy.addInteraction({
      provider: 'webhooks',
      state: state.Webhooks.NONE,
      uponReceiving: `a request to create custom webhook, which triggers Content Type events, in space "${defaultSpaceId}"`,
      withRequest: createWebhookInDefaultSpaceRequest(customWebhookContentTypeEventsRequestBody),
      willRespondWith: {
        status: 200,
        body: customWebhookContentTypeEventsResponseBody
      }
    }).as('custom-webhook-content-type-events-created-successfully');
  }
}

export const createCustomWebhookWithFilters = {
  willSucceed() {
    cy.addInteraction({
      provider: 'webhooks',
      state: state.Webhooks.NONE,
      uponReceiving: `a request to create custom webhook with filters in space "${defaultSpaceId}"`,
      withRequest: createWebhookInDefaultSpaceRequest(customWebhookFilterRequestBody),
      willRespondWith: {
        status: 200,
        body: customWebhookFilterResponseBody
      }
    }).as('custom-webhook-filter-created-successfully');
  }
}

export const createCustomWebhookWithCustomHeader = {
  willSucceed() {
    cy.addInteraction({
      provider: 'webhooks',
      state: state.Webhooks.NONE,
      uponReceiving: `a request to create custom webhook with custom header in space "${defaultSpaceId}"`,
      withRequest: createWebhookInDefaultSpaceRequest(customWebhookHeaderRequestBody),
      willRespondWith: {
        status: 200,
        body: customWebhookHeaderResponseBody
      }
    }).as('custom-webhook-header-created-successfully');
  }
}

export const createCustomWebhookWithSecretHeader = {
  willSucceed() {
    cy.addInteraction({
      provider: 'webhooks',
      state: state.Webhooks.NONE,
      uponReceiving: `a request to create custom webhook with secret header in space "${defaultSpaceId}"`,
      withRequest: createWebhookInDefaultSpaceRequest(customWebhookSecretHeaderRequestBody),
      willRespondWith: {
        status: 200,
        body: customWebhookSecretHeaderResponseBody
      }
    }).as('custom-webhook-secret-header-created-successfully');
  }
}

export const createCustomWebhookWithHTTPHeader = {
  willSucceed() {
    cy.addInteraction({
      provider: 'webhooks',
      state: state.Webhooks.NONE,
      uponReceiving: `a request to create custom webhook with http header in space "${defaultSpaceId}"`,
      withRequest: createWebhookInDefaultSpaceRequest(customWebhookHTTPRequestBody),
      willRespondWith: {
        status: 200,
        body: customWebhookHTTPResponseBody
      }
    }).as('custom-webhook-http-header-created-successfully');
  }
}

export const createCustomWebhookWithContentTypeHeader = {
  willSucceed() {
    cy.addInteraction({
      provider: 'webhooks',
      state: state.Webhooks.NONE,
      uponReceiving: `a request to create custom webhook with content type header in space "${defaultSpaceId}"`,
      withRequest: createWebhookInDefaultSpaceRequest(customWebhookContentTypeHeaderRequestBody),
      willRespondWith: {
        status: 200,
        body: customWebhookContentTypeHeaderResponseBody
      }
    }).as('custom-webhook-content-type-header-created-successfully');
  }
}

export const createCustomWebhookWithContentLengthHeader = {
  willSucceed() {
    cy.addInteraction({
      provider: 'webhooks',
      state: state.Webhooks.NONE,
      uponReceiving: `a request to create custom webhook with content length header in space "${defaultSpaceId}"`,
      withRequest: createWebhookInDefaultSpaceRequest(customWebhookContentLengthHeaderRequestBody),
      willRespondWith: {
        status: 200,
        body: customWebhookContentLengthHeaderResponseBody
      }
    }).as('custom-webhook-content-length-header-created-successfully');
  }
}

export const createCustomWebhookWithCustomPayload = {
  willSucceed() {
    cy.addInteraction({
      provider: 'webhooks',
      state: state.Webhooks.NONE,
      uponReceiving: `a request to create custom webhook with custom payload in space "${defaultSpaceId}"`,
      withRequest: createWebhookInDefaultSpaceRequest(customWebhookPayloadRequestBody),
      willRespondWith: {
        status: 200,
        body: customWebhookPayloadResponseBody
      }
    }).as('custom-webhook-payload-created-successfully');
  }
}

const getDefaultWebhookRequest: RequestOptions = {
  method: 'GET',
  path: `/spaces/${defaultSpaceId}/webhook_definitions/${defaultWebhookId}`,
  headers: defaultHeader
}

export const getDefaultWebhook = {
  // TODO: Bad test design, same request + same state and we expect different states
  // Either we have a different state for each one, or we ask for different webhook ids.
  willReturnTheDefaultWebhook() {
    return cy.addInteraction({
      provider: 'webhooks',
      state: state.Webhooks.SINGLE,
      uponReceiving: `a request to get the webhook "${defaultWebhookId}" in space "${defaultSpaceId}"`,
      withRequest: getDefaultWebhookRequest,
      willRespondWith: {
        status: 200,
        body: defaultWebhookResponseBody
      }
    }).as(state.Webhooks.SINGLE);
  },
  willReturnACustomWebhookThatTriggersContentTypeEvents() {
    return cy.addInteraction({
      provider: 'webhooks',
      state: state.Webhooks.SINGLE,
      uponReceiving: `a request to get the webhook "${defaultWebhookId}" in space "${defaultSpaceId}"`,
      withRequest: getDefaultWebhookRequest,
      willRespondWith: {
        status: 200,
        body: customWebhookContentTypeEventsResponseBody
      }
    }).as(state.Webhooks.SINGLE);
  },
  willReturnACustomWebhookWithFilters() {
    return cy.addInteraction({
      provider: 'webhooks',
      state: state.Webhooks.SINGLE,
      uponReceiving: `a request to get the webhook "${defaultWebhookId}" in space "${defaultSpaceId}"`,
      withRequest: getDefaultWebhookRequest,
      willRespondWith: {
        status: 200,
        body: customWebhookFilterResponseBody
      }
    }).as(state.Webhooks.SINGLE);
  },
  willReturnACustomWebhookWithCustomHeaders() {
    return cy.addInteraction({
      provider: 'webhooks',
      state: state.Webhooks.SINGLE,
      uponReceiving: `a request to get the webhook "${defaultWebhookId}" in space "${defaultSpaceId}"`,
      withRequest: getDefaultWebhookRequest,
      willRespondWith: {
        status: 200,
        body: customWebhookHeaderResponseBody
      }
    }).as(state.Webhooks.SINGLE);
  },
  willReturnACustomWebhookWithSecretHeaders() {
    return cy.addInteraction({
      provider: 'webhooks',
      state: state.Webhooks.SINGLE,
      uponReceiving: `a request to get the webhook "${defaultWebhookId}" in space "${defaultSpaceId}"`,
      withRequest: getDefaultWebhookRequest,
      willRespondWith: {
        status: 200,
        body: customWebhookSecretHeaderResponseBody
      }
    }).as(state.Webhooks.SINGLE);
  },
  willReturnACustomWebhookWithHTTPHeader() {
    return cy.addInteraction({
      provider: 'webhooks',
      state: state.Webhooks.SINGLE,
      uponReceiving: `a request to get the webhook "${defaultWebhookId}" in space "${defaultSpaceId}"`,
      withRequest: getDefaultWebhookRequest,
      willRespondWith: {
        status: 200,
        body: customWebhookHTTPResponseBody
      }
    }).as(state.Webhooks.SINGLE);
  },
  willReturnACustomWebhookWithContentTypeHeader() {
    return cy.addInteraction({
      provider: 'webhooks',
      state: state.Webhooks.SINGLE,
      uponReceiving: `a request to get the webhook "${defaultWebhookId}" in space "${defaultSpaceId}"`,
      withRequest: getDefaultWebhookRequest,
      willRespondWith: {
        status: 200,
        body: customWebhookContentTypeHeaderResponseBody
      }
    }).as(state.Webhooks.SINGLE);
  },
  willReturnACustomWebhookWithContentLengthHeader() {
    return cy.addInteraction({
      provider: 'webhooks',
      state: state.Webhooks.SINGLE,
      uponReceiving: `a request to get the webhook "${defaultWebhookId}" in space "${defaultSpaceId}"`,
      withRequest: getDefaultWebhookRequest,
      willRespondWith: {
        status: 200,
        body: customWebhookContentLengthHeaderResponseBody
      }
    }).as(state.Webhooks.SINGLE);
  },
  willReturnACustomWebhookWithPayload() {
    return cy.addInteraction({
      provider: 'webhooks',
      state: state.Webhooks.SINGLE,
      uponReceiving: `a request to get the webhook "${defaultWebhookId}" in space "${defaultSpaceId}"`,
      withRequest: getDefaultWebhookRequest,
      willRespondWith: {
        status: 200,
        body: customWebhookPayloadResponseBody
      }
    }).as(state.Webhooks.SINGLE);
  },
  // These two are fine, they user different states
  willReturnACustomWebhookWithSingleEvent() {
    return cy.addInteraction({
      provider: 'webhooks',
      state: state.Webhooks.SINGLE_EVENT,
      uponReceiving: `a request to get the webhook "${defaultWebhookId}" in space "${defaultSpaceId}"`,
      withRequest: getDefaultWebhookRequest,
      willRespondWith: {
        status: 200,
        body: webhookSingleEventResponseBody
      }
    }).as(state.Webhooks.SINGLE_EVENT);
  },
  willReturnACustomWebhookWithAllSetting() {
    return cy.addInteraction({
      provider: 'webhooks',
      state: state.Webhooks.ALL_SETTINGS,
      uponReceiving: `a request to get the webhook "${defaultWebhookId}" in space "${defaultSpaceId}"`,
      withRequest: getDefaultWebhookRequest,
      willRespondWith: {
        status: 200,
        body: webhookCustomAllSettingsResponseBody
      }
    }).as(state.Webhooks.ALL_SETTINGS);
  }
}

const queryFirst500DefaultWebhookCallsRequest: RequestOptions = {
  method: 'GET',
  path: `/spaces/${defaultSpaceId}/webhooks/${defaultWebhookId}/calls`,
  headers: defaultHeader,
  query: {
    limit: '500'
  }
};

export const queryFirst500DefaultWebhookCalls = {
  willReturnNone() {
    return cy.addInteraction({
      provider: 'webhooks',
      state: state.Webhooks.NO_CALLS,
      uponReceiving: `a request to get the first 500 calls for webhook "${defaultWebhookId}" in space "${defaultSpaceId}"`,
      withRequest: queryFirst500DefaultWebhookCallsRequest,
      willRespondWith: {
        status: 200,
        body: empty
      }
    }).as(state.Webhooks.NO_CALLS);
  },
  willReturnOneSuccesfulCall() {
    return cy.addInteraction({
      provider: 'webhooks',
      state: state.Webhooks.SINGLE_EVENT,
      uponReceiving: `a request to get the first 500 calls for webhook "${defaultWebhookId}" in space "${defaultSpaceId}"`,
      withRequest: queryFirst500DefaultWebhookCallsRequest,
      willRespondWith: {
        status: 200,
        body: webhookSuccessfulCallResponseBody
      }
    });
  }
}

export const getAllCallsForDefaultWebhook = {
  willReturnNone() {
    return cy.addInteraction({
      provider: 'webhooks',
      state: state.Webhooks.NO_CALLS,
      uponReceiving: `a request to get all calls state of webhook "${defaultWebhookId}" in space "${defaultSpaceId}"`,
      withRequest: {
        method: 'GET',
        path: `/spaces/${defaultSpaceId}/webhooks/${defaultWebhookId}/health`,
        headers: defaultHeader
      },
      willRespondWith: {
        status: 200,
        body: noWebhookCallsResponseBody
      }
    }).as(state.Webhooks.NO_CALLS);
  }
}

const deleteDefaultWebhookRequest: RequestOptions = {
  method: 'DELETE',
  path: `/spaces/${defaultSpaceId}/webhook_definitions/${defaultWebhookId}`,
  headers: defaultHeader
}

export const deleteDefaultWebhook = {
  willSucceed() {
    return cy.addInteraction({
      provider: 'webhooks',
      state: state.Webhooks.SINGLE,
      uponReceiving: `a request to delete webhook "${defaultWebhookId}" in space "${defaultSpaceId}"`,
      withRequest: deleteDefaultWebhookRequest,
      willRespondWith: {
        status: 204
      }
    }).as('default-webhook-deleted-successfully');
  },
  willFailWithAnInternalServerError() {
    return cy.addInteraction({
      provider: 'webhooks',
      state: state.Webhooks.INTERNAL_SERVER_ERROR,
      uponReceiving: `a request to delete webhook "${defaultWebhookId}" in space "${defaultSpaceId}"`,
      withRequest: deleteDefaultWebhookRequest,
      willRespondWith: {
        status: 500
      }
    }).as(state.Webhooks.INTERNAL_SERVER_ERROR);
  }
}
