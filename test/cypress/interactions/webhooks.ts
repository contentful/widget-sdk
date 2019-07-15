import * as state from '../util/interactionState';
import {
  getWebhooks,
  getWebhook,
  defaultSpaceId,
  postWebhook,
  defaultWebhookId,
  getWebhookCalls,
  getWebhooksCallsState,
  deleteWebhook
} from '../util/requests';

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

const queryWebhooksLimit = {
  limit: '100'
};
const queryCallsLimit = {
  limit: '500'
};

export function noWebhooksResponse() {
  return cy
    .addInteraction({
      provider: 'webhooks',
      state: state.Webhooks.NONE,
      uponReceiving: 'a request for all webhooks',
      withRequest: getWebhooks(defaultSpaceId, queryWebhooksLimit),
      willRespondWith: {
        status: 200,
        body: empty
      }
    })
    .as(state.Webhooks.NONE);
}

export function webhooksErrorResponse() {
  cy.addInteraction({
    provider: 'webhooks',
    state: state.Webhooks.INTERNAL_SERVER_ERROR,
    uponReceiving: 'a request for all webhooks',
    withRequest: getWebhooks(defaultSpaceId, queryWebhooksLimit),
    willRespondWith: {
      status: 500,
      body: empty
    }
  }).as(state.Webhooks.INTERNAL_SERVER_ERROR);
}

export function defaultWebhookCreatedSuccessResponse() {
  cy.addInteraction({
    provider: 'webhooks',
    state: state.Webhooks.NONE,
    uponReceiving: 'a post request for creation default webhook',
    withRequest: postWebhook(defaultSpaceId, defaultWebhookRequestBody),
    willRespondWith: {
      status: 200,
      body: defaultWebhookResponseBody
    }
  }).as('default-webhook-created-successfully');
}

export function customWebhookContentTypeEventsCreatedSuccessResponse() {
  cy.addInteraction({
    provider: 'webhooks',
    state: state.Webhooks.NONE,
    uponReceiving: 'a post request for creation custom webhook, which triggers Content Type events',
    withRequest: postWebhook(defaultSpaceId, customWebhookContentTypeEventsRequestBody),
    willRespondWith: {
      status: 200,
      body: customWebhookContentTypeEventsResponseBody
    }
  }).as('custom-webhook-content-type-events-created-successfully');
}

export function customWebhookFilterCreatedSuccessResponse() {
  cy.addInteraction({
    provider: 'webhooks',
    state: state.Webhooks.NONE,
    uponReceiving: 'a post request for creation custom webhook with filter',
    withRequest: postWebhook(defaultSpaceId, customWebhookFilterRequestBody),
    willRespondWith: {
      status: 200,
      body: customWebhookFilterResponseBody
    }
  }).as('custom-webhook-filter-created-successfully');
}

export function customWebhookHeaderCreatedSuccessResponse() {
  cy.addInteraction({
    provider: 'webhooks',
    state: state.Webhooks.NONE,
    uponReceiving: 'a post request for creation custom webhook with custom header',
    withRequest: postWebhook(defaultSpaceId, customWebhookHeaderRequestBody),
    willRespondWith: {
      status: 200,
      body: customWebhookHeaderResponseBody
    }
  }).as('custom-webhook-header-created-successfully');
}

export function customWebhookSecretHeaderCreatedSuccessResponse() {
  cy.addInteraction({
    provider: 'webhooks',
    state: state.Webhooks.NONE,
    uponReceiving: 'a post request for creation custom webhook with secret header',
    withRequest: postWebhook(defaultSpaceId, customWebhookSecretHeaderRequestBody),
    willRespondWith: {
      status: 200,
      body: customWebhookSecretHeaderResponseBody
    }
  }).as('custom-webhook-secret-header-created-successfully');
}

export function customWebhookHTTPHeaderCreatedSuccessResponse() {
  cy.addInteraction({
    provider: 'webhooks',
    state: state.Webhooks.NONE,
    uponReceiving: 'a post request for creation custom webhook with http headet',
    withRequest: postWebhook(defaultSpaceId, customWebhookHTTPRequestBody),
    willRespondWith: {
      status: 200,
      body: customWebhookHTTPResponseBody
    }
  }).as('custom-webhook-http-header-created-successfully');
}

export function customWebhookContentTypeHeaderCreatedSuccessResponse() {
  cy.addInteraction({
    provider: 'webhooks',
    state: state.Webhooks.NONE,
    uponReceiving: 'a post request for creation custom webhook with content type header',
    withRequest: postWebhook(defaultSpaceId, customWebhookContentTypeHeaderRequestBody),
    willRespondWith: {
      status: 200,
      body: customWebhookContentTypeHeaderResponseBody
    }
  }).as('custom-webhook-content-type-header-created-successfully');
}

export function customWebhookContentLengthHeaderCreatedSuccessResponse() {
  cy.addInteraction({
    provider: 'webhooks',
    state: state.Webhooks.NONE,
    uponReceiving: 'a post request for creation custom webhook with content length',
    withRequest: postWebhook(defaultSpaceId, customWebhookContentLengthHeaderRequestBody),
    willRespondWith: {
      status: 200,
      body: customWebhookContentLengthHeaderResponseBody
    }
  }).as('custom-webhook-content-length-header-created-successfully');
}

export function customWebhookPayloadCreatedSuccessResponse() {
  cy.addInteraction({
    provider: 'webhooks',
    state: state.Webhooks.NONE,
    uponReceiving: 'a post request for creation custom webhook with custom payload',
    withRequest: postWebhook(defaultSpaceId, customWebhookPayloadRequestBody),
    willRespondWith: {
      status: 200,
      body: customWebhookPayloadResponseBody
    }
  }).as('custom-webhook-payload-created-successfully');
}

export function defaultWebhookResponse() {
  cy.addInteraction({
    provider: 'webhooks',
    state: state.Webhooks.SINGLE,
    uponReceiving: 'a get request for default webhook',
    withRequest: getWebhook(defaultSpaceId, defaultWebhookId),
    willRespondWith: {
      status: 200,
      body: defaultWebhookResponseBody
    }
  }).as(state.Webhooks.SINGLE);
}

export function customWebhookContentTypeEventsResponse() {
  cy.addInteraction({
    provider: 'webhooks',
    state: state.Webhooks.SINGLE,
    uponReceiving: 'a get request for custom webhook, which triggers Content Type events',
    withRequest: getWebhook(defaultSpaceId, defaultWebhookId),
    willRespondWith: {
      status: 200,
      body: customWebhookContentTypeEventsResponseBody
    }
  }).as(state.Webhooks.SINGLE);
}

export function customWebhookFilterResponse() {
  cy.addInteraction({
    provider: 'webhooks',
    state: state.Webhooks.SINGLE,
    uponReceiving: 'a get request for custom webhook with filter',
    withRequest: getWebhook(defaultSpaceId, defaultWebhookId),
    willRespondWith: {
      status: 200,
      body: customWebhookFilterResponseBody
    }
  }).as(state.Webhooks.SINGLE);
}

export function customWebhookHeaderResponse() {
  cy.addInteraction({
    provider: 'webhooks',
    state: state.Webhooks.SINGLE,
    uponReceiving: 'a get request for custom webhook with custom header',
    withRequest: getWebhook(defaultSpaceId, defaultWebhookId),
    willRespondWith: {
      status: 200,
      body: customWebhookHeaderResponseBody
    }
  }).as(state.Webhooks.SINGLE);
}

export function customWebhookSecretHeaderResponse() {
  cy.addInteraction({
    provider: 'webhooks',
    state: state.Webhooks.SINGLE,
    uponReceiving: 'a get request for custom webhook with secret header',
    withRequest: getWebhook(defaultSpaceId, defaultWebhookId),
    willRespondWith: {
      status: 200,
      body: customWebhookSecretHeaderResponseBody
    }
  }).as(state.Webhooks.SINGLE);
}

export function customWebhookHTTPHeaderResponse() {
  cy.addInteraction({
    provider: 'webhooks',
    state: state.Webhooks.SINGLE,
    uponReceiving: 'a get request for custom webhook with http header',
    withRequest: getWebhook(defaultSpaceId, defaultWebhookId),
    willRespondWith: {
      status: 200,
      body: customWebhookHTTPResponseBody
    }
  }).as(state.Webhooks.SINGLE);
}

export function customWebhookContentTypeHeaderResponse() {
  cy.addInteraction({
    provider: 'webhooks',
    state: state.Webhooks.SINGLE,
    uponReceiving: 'a get request for custom webhook with content type header',
    withRequest: getWebhook(defaultSpaceId, defaultWebhookId),
    willRespondWith: {
      status: 200,
      body: customWebhookContentTypeHeaderResponseBody
    }
  }).as(state.Webhooks.SINGLE);
}

export function customWebhookContentLengthHeaderResponse() {
  cy.addInteraction({
    provider: 'webhooks',
    state: state.Webhooks.SINGLE,
    uponReceiving: 'a get request for custom webhook with content length header',
    withRequest: getWebhook(defaultSpaceId, defaultWebhookId),
    willRespondWith: {
      status: 200,
      body: customWebhookContentLengthHeaderResponseBody
    }
  }).as(state.Webhooks.SINGLE);
}

export function customWebhookPayloadResponse() {
  cy.addInteraction({
    provider: 'webhooks',
    state: state.Webhooks.SINGLE,
    uponReceiving: 'a get request for custom webhook with payload',
    withRequest: getWebhook(defaultSpaceId, defaultWebhookId),
    willRespondWith: {
      status: 200,
      body: customWebhookPayloadResponseBody
    }
  }).as(state.Webhooks.SINGLE);
}

export function noWebhookCallsResponse() {
  cy.addInteraction({
    provider: 'webhooks',
    state: state.Webhooks.NO_CALLS,
    uponReceiving: 'a get request for all webhook calls',
    withRequest: getWebhookCalls(defaultSpaceId, defaultWebhookId, queryCallsLimit),
    willRespondWith: {
      status: 200,
      body: empty
    }
  }).as(state.Webhooks.NO_CALLS);
}

export function customWebhookSingleEventResponse() {
  cy.addInteraction({
    provider: 'webhooks',
    state: state.Webhooks.SINGLE_EVENT,
    uponReceiving: 'a get request for custom webhook',
    withRequest: getWebhook(defaultSpaceId, defaultWebhookId),
    willRespondWith: {
      status: 200,
      body: webhookSingleEventResponseBody
    }
  }).as(state.Webhooks.SINGLE_EVENT);
}

export function customWebhookAllSettingsResponse() {
  cy.addInteraction({
    provider: 'webhooks',
    state: state.Webhooks.ALL_SETTINGS,
    uponReceiving: 'a get request for custom webhook with all the settings set',
    withRequest: getWebhook(defaultSpaceId, defaultWebhookId),
    willRespondWith: {
      status: 200,
      body: webhookCustomAllSettingsResponseBody
    }
  }).as(state.Webhooks.ALL_SETTINGS);
}

export function webhookCallSuccessfulResponse() {
  return cy.addInteraction({
    provider: 'webhooks',
    state: state.Webhooks.SINGLE_EVENT,
    uponReceiving: 'a get request for all webhook calls',
    withRequest: getWebhookCalls(defaultSpaceId, defaultWebhookId, queryCallsLimit),
    willRespondWith: {
      status: 200,
      body: webhookSuccessfulCallResponseBody
    }
  });
}

export function singleWebhookResponse() {
  return cy
    .addInteraction({
      provider: 'webhooks',
      state: state.Webhooks.SINGLE,
      uponReceiving: 'a request for all webhooks',
      withRequest: getWebhooks(defaultSpaceId, queryWebhooksLimit),
      willRespondWith: {
        status: 200,
        body: singleWebhookResponseBody
      }
    })
    .as(state.Webhooks.SINGLE);
}

export function noWebhooksCallsResponse() {
  return cy
    .addInteraction({
      provider: 'webhooks',
      state: state.Webhooks.NO_CALLS,
      uponReceiving: 'a request for calls state of each webhook',
      withRequest: getWebhooksCallsState(defaultSpaceId, defaultWebhookId),
      willRespondWith: {
        status: 200,
        body: noWebhookCallsResponseBody
      }
    })
    .as(state.Webhooks.NO_CALLS);
}

export function defaultWebhookDeletedSuccessResponse() {
  cy.addInteraction({
    provider: 'webhooks',
    state: state.Webhooks.SINGLE,
    uponReceiving: 'Delete request for deletion default webhook',
    withRequest: deleteWebhook(defaultSpaceId, defaultWebhookId),
    willRespondWith: {
      status: 204
    }
  }).as('default-webhook-deleted-successfully');
}

export function defaultWebhookDeletedErrorResponse() {
  cy.addInteraction({
    provider: 'webhooks',
    state: state.Webhooks.INTERNAL_SERVER_ERROR,
    uponReceiving: 'Delete request with error response for deletion default webhook',
    withRequest: deleteWebhook(defaultSpaceId, defaultWebhookId),
    willRespondWith: {
      status: 500
    }
  }).as(state.Webhooks.INTERNAL_SERVER_ERROR);
}
