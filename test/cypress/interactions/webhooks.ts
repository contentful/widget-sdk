import * as state from '../util/interactionState';
import {
  getWebhooks,
  getWebhook,
  defaultSpaceId,
  postWebhook,
  defaultWebhookId,
  getWebhookCalls,
  getWebhooksCallsState
} from '../util/requests';

const empty = require('../fixtures/responses/empty.json');
const defaultWebhookRequestBody = require('../fixtures/requests/default-webhook.json');
const defaultWebhookResponseBody = require('../fixtures/responses/webhooks/default-webhook.json');
const webhookSingleEventResponseBody = require('../fixtures/responses/webhooks/webhook-single-event.json');
const webhookSuccessfulCallResponseBody = require('../fixtures/responses/webhooks/webhook-call-successful.json');
const singleWebhookResponseBody = require('../fixtures/responses/webhooks/single-webhook.json');
const noWebhookCallsResponseBody = require('../fixtures/responses/webhooks/no-webhook-calls.json');
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
    state: 'noWebhooksError',
    uponReceiving: 'a request for all webhooks',
    withRequest: getWebhooks(defaultSpaceId, queryWebhooksLimit),
    willRespondWith: {
      status: 500,
      body: empty
    }
  }).as(state.Webhooks.ERROR);
}

export function defaultWebhookCreatedSuccessResponse() {
  cy.addInteraction({
    provider: 'webhooks',
    state: state.Webhooks.NONE,
    uponReceiving: 'a put request for creation new webhook',
    withRequest: postWebhook(defaultSpaceId, defaultWebhookRequestBody),
    willRespondWith: {
      status: 200,
      body: defaultWebhookResponseBody
    }
  }).as('default-webhook-created-successfully');
}

export function defaultWebhookResponse() {
  cy.addInteraction({
    provider: 'webhooks',
    state: state.Webhook.DEFAULT,
    uponReceiving: 'a get request for default webhook',
    withRequest: getWebhook(defaultSpaceId, defaultWebhookId),
    willRespondWith: {
      status: 200,
      body: defaultWebhookResponseBody
    }
  }).as(state.Webhook.DEFAULT);
}

export function noWebhookCallsResponse() {
  cy.addInteraction({
    provider: 'webhooks',
    state: state.Webhook.DEFAULT,
    uponReceiving: 'a get request for all webhook calls',
    withRequest: getWebhookCalls(defaultSpaceId, defaultWebhookId, queryCallsLimit),
    willRespondWith: {
      status: 200,
      body: empty
    }
  }).as(state.Webhook.CALLS_NONE);
}

export function customWebhookSingleEventResponse() {
  cy.addInteraction({
    provider: 'webhooks',
    state: state.Webhook.SINGLE_EVENT,
    uponReceiving: 'a get request for custom webhook',
    withRequest: getWebhook(defaultSpaceId, defaultWebhookId),
    willRespondWith: {
      status: 200,
      body: webhookSingleEventResponseBody
    }
  }).as(state.Webhook.SINGLE_EVENT);
}

export function webhookCallSuccessfulResponse() {
  cy.addInteraction({
    provider: 'webhooks',
    state: state.Webhook.SINGLE_EVENT,
    uponReceiving: 'a get request for all webhook calls',
    withRequest: getWebhookCalls(defaultSpaceId, defaultWebhookId, queryCallsLimit),
    willRespondWith: {
      status: 200,
      body: webhookSuccessfulCallResponseBody
    }
  }).as(state.Webhook.CALL_SUCCESSFUL);
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
      state: state.Webhooks.CALLS_NONE,
      uponReceiving: 'a request for calls state of each webhook',
      withRequest: getWebhooksCallsState(defaultSpaceId, defaultWebhookId),
      willRespondWith: {
        status: 200,
        body: noWebhookCallsResponseBody
      }
    })
    .as(state.Webhooks.CALLS_NONE);
}
