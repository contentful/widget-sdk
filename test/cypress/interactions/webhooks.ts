import { defaultHeader, defaultSpaceId, defaultWebhookId } from '../util/requests';
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
    limit: '100',
  },
};

enum States {
  NONE = 'webhooks/none',
  INTERNAL_SERVER_ERROR = 'webhooks/error',
  SINGLE = 'webhooks/single',
  DEFAULT_WEBHOOK_TRIGGERS_CONTENT_TYPE_EVENTS = 'webhooks/default-webhook-triggers-content-type-events',
  DEFAULT_WEBHOOK_HAS_FILTER = 'webhooks/default-webhook-has-filter',
  DEFAULT_WEBHOOK_HAS_CUSTOM_HEADER = 'webhooks/default-webhook-has-custom-header',
  DEFAULT_WEBHOOK_HAS_SECRET_HEADER = 'webhooks/default-webhook-has-secret-header',
  DEFAULT_WEBHOOK_HAS_HTTP_HEADER = 'webhooks/default-webhook-has-http-header',
  DEFAULT_WEBHOOK_HAS_CONTENT_TYPE_HEADER = 'webhooks/default-webhook-has-content-type-header',
  DEFAULT_WEBHOOK_HAS_CONTENT_LENGTH_HEADER = 'webhooks/default-webhook-has-content-length-header',
  DEFAULT_WEBHOOK_HAS_PAYLOAD = 'webhooks/default-webhook-has-payload',
  DEFAULT_WEBHOOK_HAS_NO_CALLS = 'webhooks/default-webhook-has-no-calls',
  DEFAULT_WEBHOOK_HAS_SINGLE_EVENT = 'webhooks/default-webhook-has-single-event',
  DEFAULT_WEBHOOK_HAS_ALL_SETTINGS = 'webhooks/default-webhook-has-all-settings',
}

export const queryFirst100WebhooksInDefaultSpace = {
  willFindNone() {
    cy.addInteraction({
      provider: 'webhooks',
      state: States.NONE,
      uponReceiving: `a query for the first 100 webhooks in space "${defaultSpaceId}"`,
      withRequest: queryFirst100WebhooksInDefaultSpaceRequest,
      willRespondWith: {
        status: 200,
        body: empty,
      },
    }).as('queryFirst100WebhooksInDefaultSpace');

    return '@queryFirst100WebhooksInDefaultSpace';
  },
  willFindOne() {
    cy.addInteraction({
      provider: 'webhooks',
      state: States.SINGLE,
      uponReceiving: `a query for the first 100 webhooks in space "${defaultSpaceId}"`,
      withRequest: queryFirst100WebhooksInDefaultSpaceRequest,
      willRespondWith: {
        status: 200,
        body: singleWebhookResponseBody,
      },
    }).as('queryFirst100WebhooksInDefaultSpace');

    return '@queryFirst100WebhooksInDefaultSpace';
  },
  willFailWithInternalServerError() {
    cy.addInteraction({
      provider: 'webhooks',
      state: States.INTERNAL_SERVER_ERROR,
      uponReceiving: `a query for the first 100 webhooks in space "${defaultSpaceId}"`,
      withRequest: queryFirst100WebhooksInDefaultSpaceRequest,
      willRespondWith: {
        status: 500,
        body: empty,
      },
    }).as('queryFirst100WebhooksInDefaultSpace');

    return '@queryFirst100WebhooksInDefaultSpace';
  },
};

function createWebhookInDefaultSpaceRequest(body: Object): RequestOptions {
  return {
    method: 'POST',
    path: `/spaces/${defaultSpaceId}/webhook_definitions`,
    headers: defaultHeader,
    body,
  };
}

export const createDefaultWebhook = {
  willSucceed() {
    cy.addInteraction({
      provider: 'webhooks',
      state: States.NONE,
      uponReceiving: `a request to create default webhook in space "${defaultSpaceId}"`,
      withRequest: createWebhookInDefaultSpaceRequest(defaultWebhookRequestBody),
      willRespondWith: {
        status: 200,
        body: defaultWebhookResponseBody,
      },
    }).as('createDefaultWebhook');

    return '@createDefaultWebhook';
  },
};

export const createCustomWebhookTriggeringContentTypeEvents = {
  willSucceed() {
    cy.addInteraction({
      provider: 'webhooks',
      state: States.NONE,
      uponReceiving: `a request to create custom webhook, which triggers Content Type events, in space "${defaultSpaceId}"`,
      withRequest: createWebhookInDefaultSpaceRequest(customWebhookContentTypeEventsRequestBody),
      willRespondWith: {
        status: 200,
        body: customWebhookContentTypeEventsResponseBody,
      },
    }).as('createCustomWebhookTriggeringContentTypeEvents');

    return '@createCustomWebhookTriggeringContentTypeEvents';
  },
};

export const createCustomWebhookWithFilters = {
  willSucceed() {
    cy.addInteraction({
      provider: 'webhooks',
      state: States.NONE,
      uponReceiving: `a request to create custom webhook with filters in space "${defaultSpaceId}"`,
      withRequest: createWebhookInDefaultSpaceRequest(customWebhookFilterRequestBody),
      willRespondWith: {
        status: 200,
        body: customWebhookFilterResponseBody,
      },
    }).as('createCustomWebhookWithFilters');

    return '@createCustomWebhookWithFilters';
  },
};

export const createCustomWebhookWithCustomHeader = {
  willSucceed() {
    cy.addInteraction({
      provider: 'webhooks',
      state: States.NONE,
      uponReceiving: `a request to create custom webhook with custom header in space "${defaultSpaceId}"`,
      withRequest: createWebhookInDefaultSpaceRequest(customWebhookHeaderRequestBody),
      willRespondWith: {
        status: 200,
        body: customWebhookHeaderResponseBody,
      },
    }).as('createCustomWebhookWithCustomHeader');

    return '@createCustomWebhookWithCustomHeader';
  },
};

export const createCustomWebhookWithSecretHeader = {
  willSucceed() {
    cy.addInteraction({
      provider: 'webhooks',
      state: States.NONE,
      uponReceiving: `a request to create custom webhook with secret header in space "${defaultSpaceId}"`,
      withRequest: createWebhookInDefaultSpaceRequest(customWebhookSecretHeaderRequestBody),
      willRespondWith: {
        status: 200,
        body: customWebhookSecretHeaderResponseBody,
      },
    }).as('createCustomWebhookWithSecretHeader');

    return '@createCustomWebhookWithSecretHeader';
  },
};

export const createCustomWebhookWithHTTPHeader = {
  willSucceed() {
    cy.addInteraction({
      provider: 'webhooks',
      state: States.NONE,
      uponReceiving: `a request to create custom webhook with http header in space "${defaultSpaceId}"`,
      withRequest: createWebhookInDefaultSpaceRequest(customWebhookHTTPRequestBody),
      willRespondWith: {
        status: 200,
        body: customWebhookHTTPResponseBody,
      },
    }).as('createCustomWebhookWithHTTPHeader');

    return '@createCustomWebhookWithHTTPHeader';
  },
};

export const createCustomWebhookWithContentTypeHeader = {
  willSucceed() {
    cy.addInteraction({
      provider: 'webhooks',
      state: States.NONE,
      uponReceiving: `a request to create custom webhook with content type header in space "${defaultSpaceId}"`,
      withRequest: createWebhookInDefaultSpaceRequest(customWebhookContentTypeHeaderRequestBody),
      willRespondWith: {
        status: 200,
        body: customWebhookContentTypeHeaderResponseBody,
      },
    }).as('createCustomWebhookWithContentTypeHeader');

    return '@createCustomWebhookWithContentTypeHeader';
  },
};

export const createCustomWebhookWithContentLengthHeader = {
  willSucceed() {
    cy.addInteraction({
      provider: 'webhooks',
      state: States.NONE,
      uponReceiving: `a request to create custom webhook with content length header in space "${defaultSpaceId}"`,
      withRequest: createWebhookInDefaultSpaceRequest(customWebhookContentLengthHeaderRequestBody),
      willRespondWith: {
        status: 200,
        body: customWebhookContentLengthHeaderResponseBody,
      },
    }).as('createCustomWebhookWithContentLengthHeader');

    return '@createCustomWebhookWithContentLengthHeader';
  },
};

export const createCustomWebhookWithCustomPayload = {
  willSucceed() {
    cy.addInteraction({
      provider: 'webhooks',
      state: States.NONE,
      uponReceiving: `a request to create custom webhook with custom payload in space "${defaultSpaceId}"`,
      withRequest: createWebhookInDefaultSpaceRequest(customWebhookPayloadRequestBody),
      willRespondWith: {
        status: 200,
        body: customWebhookPayloadResponseBody,
      },
    }).as('createCustomWebhookWithCustomPayload');

    return '@createCustomWebhookWithCustomPayload';
  },
};

const getDefaultWebhookRequest: RequestOptions = {
  method: 'GET',
  path: `/spaces/${defaultSpaceId}/webhook_definitions/${defaultWebhookId}`,
  headers: defaultHeader,
};

export const getDefaultWebhook = {
  willReturnTheDefaultWebhook() {
    cy.addInteraction({
      provider: 'webhooks',
      state: States.SINGLE,
      uponReceiving: `a request to get the webhook "${defaultWebhookId}" in space "${defaultSpaceId}"`,
      withRequest: getDefaultWebhookRequest,
      willRespondWith: {
        status: 200,
        body: defaultWebhookResponseBody,
      },
    }).as('getDefaultWebhook');

    return '@getDefaultWebhook';
  },
  willReturnACustomWebhookThatTriggersContentTypeEvents() {
    cy.addInteraction({
      provider: 'webhooks',
      state: States.DEFAULT_WEBHOOK_TRIGGERS_CONTENT_TYPE_EVENTS,
      uponReceiving: `a request to get the webhook "${defaultWebhookId}" in space "${defaultSpaceId}"`,
      withRequest: getDefaultWebhookRequest,
      willRespondWith: {
        status: 200,
        body: customWebhookContentTypeEventsResponseBody,
      },
    }).as('getDefaultWebhook');

    return '@getDefaultWebhook';
  },
  willReturnACustomWebhookWithFilter() {
    cy.addInteraction({
      provider: 'webhooks',
      state: States.DEFAULT_WEBHOOK_HAS_FILTER,
      uponReceiving: `a request to get the webhook "${defaultWebhookId}" in space "${defaultSpaceId}"`,
      withRequest: getDefaultWebhookRequest,
      willRespondWith: {
        status: 200,
        body: customWebhookFilterResponseBody,
      },
    }).as('getDefaultWebhook');

    return '@getDefaultWebhook';
  },
  willReturnACustomWebhookWithCustomHeader() {
    cy.addInteraction({
      provider: 'webhooks',
      state: States.DEFAULT_WEBHOOK_HAS_CUSTOM_HEADER,
      uponReceiving: `a request to get the webhook "${defaultWebhookId}" in space "${defaultSpaceId}"`,
      withRequest: getDefaultWebhookRequest,
      willRespondWith: {
        status: 200,
        body: customWebhookHeaderResponseBody,
      },
    }).as('getDefaultWebhook');

    return '@getDefaultWebhook';
  },
  willReturnACustomWebhookWithSecretHeader() {
    cy.addInteraction({
      provider: 'webhooks',
      state: States.DEFAULT_WEBHOOK_HAS_SECRET_HEADER,
      uponReceiving: `a request to get the webhook "${defaultWebhookId}" in space "${defaultSpaceId}"`,
      withRequest: getDefaultWebhookRequest,
      willRespondWith: {
        status: 200,
        body: customWebhookSecretHeaderResponseBody,
      },
    }).as('getDefaultWebhook');

    return '@getDefaultWebhook';
  },
  willReturnACustomWebhookWithHTTPHeader() {
    cy.addInteraction({
      provider: 'webhooks',
      state: States.DEFAULT_WEBHOOK_HAS_HTTP_HEADER,
      uponReceiving: `a request to get the webhook "${defaultWebhookId}" in space "${defaultSpaceId}"`,
      withRequest: getDefaultWebhookRequest,
      willRespondWith: {
        status: 200,
        body: customWebhookHTTPResponseBody,
      },
    }).as('getDefaultWebhook');

    return '@getDefaultWebhook';
  },
  willReturnACustomWebhookWithContentTypeHeader() {
    cy.addInteraction({
      provider: 'webhooks',
      state: States.DEFAULT_WEBHOOK_HAS_CONTENT_TYPE_HEADER,
      uponReceiving: `a request to get the webhook "${defaultWebhookId}" in space "${defaultSpaceId}"`,
      withRequest: getDefaultWebhookRequest,
      willRespondWith: {
        status: 200,
        body: customWebhookContentTypeHeaderResponseBody,
      },
    }).as('getDefaultWebhook');

    return '@getDefaultWebhook';
  },
  willReturnACustomWebhookWithContentLengthHeader() {
    cy.addInteraction({
      provider: 'webhooks',
      state: States.DEFAULT_WEBHOOK_HAS_CONTENT_LENGTH_HEADER,
      uponReceiving: `a request to get the webhook "${defaultWebhookId}" in space "${defaultSpaceId}"`,
      withRequest: getDefaultWebhookRequest,
      willRespondWith: {
        status: 200,
        body: customWebhookContentLengthHeaderResponseBody,
      },
    }).as('getDefaultWebhook');

    return '@getDefaultWebhook';
  },
  willReturnACustomWebhookWithPayload() {
    cy.addInteraction({
      provider: 'webhooks',
      state: States.DEFAULT_WEBHOOK_HAS_PAYLOAD,
      uponReceiving: `a request to get the webhook "${defaultWebhookId}" in space "${defaultSpaceId}"`,
      withRequest: getDefaultWebhookRequest,
      willRespondWith: {
        status: 200,
        body: customWebhookPayloadResponseBody,
      },
    }).as('getDefaultWebhook');

    return '@getDefaultWebhook';
  },
  willReturnACustomWebhookWithSingleEvent() {
    cy.addInteraction({
      provider: 'webhooks',
      state: States.DEFAULT_WEBHOOK_HAS_SINGLE_EVENT,
      uponReceiving: `a request to get the webhook "${defaultWebhookId}" in space "${defaultSpaceId}"`,
      withRequest: getDefaultWebhookRequest,
      willRespondWith: {
        status: 200,
        body: webhookSingleEventResponseBody,
      },
    }).as('getDefaultWebhook');

    return '@getDefaultWebhook';
  },
  willReturnACustomWebhookWithAllSetting() {
    cy.addInteraction({
      provider: 'webhooks',
      state: States.DEFAULT_WEBHOOK_HAS_ALL_SETTINGS,
      uponReceiving: `a request to get the webhook "${defaultWebhookId}" in space "${defaultSpaceId}"`,
      withRequest: getDefaultWebhookRequest,
      willRespondWith: {
        status: 200,
        body: webhookCustomAllSettingsResponseBody,
      },
    }).as('getDefaultWebhook');

    return '@getDefaultWebhook';
  },
};

const queryFirst500DefaultWebhookCallsRequest: RequestOptions = {
  method: 'GET',
  path: `/spaces/${defaultSpaceId}/webhooks/${defaultWebhookId}/calls`,
  headers: defaultHeader,
  query: {
    limit: '500',
  },
};

export const queryFirst500DefaultWebhookCalls = {
  willReturnNone() {
    cy.addInteraction({
      provider: 'webhooks',
      state: States.DEFAULT_WEBHOOK_HAS_NO_CALLS,
      uponReceiving: `a request to get the first 500 calls for webhook "${defaultWebhookId}" in space "${defaultSpaceId}"`,
      withRequest: queryFirst500DefaultWebhookCallsRequest,
      willRespondWith: {
        status: 200,
        body: empty,
      },
    }).as('queryFirst500DefaultWebhookCalls');

    return '@queryFirst500DefaultWebhookCalls';
  },
  willReturnOneSuccesfulCall() {
    cy.addInteraction({
      provider: 'webhooks',
      state: States.DEFAULT_WEBHOOK_HAS_SINGLE_EVENT,
      uponReceiving: `a request to get the first 500 calls for webhook "${defaultWebhookId}" in space "${defaultSpaceId}"`,
      withRequest: queryFirst500DefaultWebhookCallsRequest,
      willRespondWith: {
        status: 200,
        body: webhookSuccessfulCallResponseBody,
      },
    }).as('queryFirst500DefaultWebhookCalls');

    return '@queryFirst500DefaultWebhookCalls';
  },
};

export const getAllCallsForDefaultWebhook = {
  willReturnNone() {
    cy.addInteraction({
      provider: 'webhooks',
      state: States.DEFAULT_WEBHOOK_HAS_NO_CALLS,
      uponReceiving: `a request to get all calls state of webhook "${defaultWebhookId}" in space "${defaultSpaceId}"`,
      withRequest: {
        method: 'GET',
        path: `/spaces/${defaultSpaceId}/webhooks/${defaultWebhookId}/health`,
        headers: defaultHeader,
      },
      willRespondWith: {
        status: 200,
        body: noWebhookCallsResponseBody,
      },
    }).as('getAllCallsForDefaultWebhook');

    return '@getAllCallsForDefaultWebhook';
  },
};

const deleteDefaultWebhookRequest: RequestOptions = {
  method: 'DELETE',
  path: `/spaces/${defaultSpaceId}/webhook_definitions/${defaultWebhookId}`,
  headers: defaultHeader,
};

export const deleteDefaultWebhook = {
  willSucceed() {
    cy.addInteraction({
      provider: 'webhooks',
      state: States.SINGLE,
      uponReceiving: `a request to delete webhook "${defaultWebhookId}" in space "${defaultSpaceId}"`,
      withRequest: deleteDefaultWebhookRequest,
      willRespondWith: {
        status: 204,
      },
    }).as('deleteDefaultWebhook');

    return '@deleteDefaultWebhook';
  },
  willFailWithAnInternalServerError() {
    cy.addInteraction({
      provider: 'webhooks',
      state: States.INTERNAL_SERVER_ERROR,
      uponReceiving: `a request to delete webhook "${defaultWebhookId}" in space "${defaultSpaceId}"`,
      withRequest: deleteDefaultWebhookRequest,
      willRespondWith: {
        status: 500,
      },
    }).as('willFailWithAnInternalServerError');

    return '@willFailWithAnInternalServerError';
  },
};
