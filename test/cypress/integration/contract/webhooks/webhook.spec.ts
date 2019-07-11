import { defaultRequestsMock } from '../../../util/factories';
import * as state from '../../../util/interactionState';
import { defaultSpaceId, defaultWebhookId } from '../../../util/requests';
import {
  defaultWebhookCreatedSuccessResponse,
  defaultWebhookResponse,
  noWebhookCallsResponse,
  customWebhookSingleEventResponse,
  webhookCallSuccessfulResponse,
  defaultWebhookDeletedSuccessResponse,
  noWebhooksResponse,
  defaultWebhookDeletedErrorResponse,
  customWebhookAllSettingsResponse
} from '../../../interactions/webhooks';

describe('Webhook', () => {
  const newWebhook = {
    name: 'Webhook',
    url: 'https://www.contentful.com/'
  };

  before(() =>
    cy.startFakeServer({
      consumer: 'user_interface',
      provider: 'webhooks',
      cors: true,
      pactfileWriteMode: 'merge',
      spec: 2
    })
  );

  beforeEach(() => {
    cy.resetAllFakeServers();
    defaultRequestsMock();
  });

  context('creating a new webhook', () => {
    beforeEach(() => {
      cy.visit(`/spaces/${defaultSpaceId}/settings/webhooks/new`);
      cy.wait([`@${state.Token.VALID}`]);
    });

    it('checks that default webhook is successfully created', () => {
      defaultWebhookCreatedSuccessResponse();
      defaultWebhookResponse();
      noWebhookCallsResponse();

      cy.get('#webhook-name').type(newWebhook.name);
      cy.get('#webhook-url').type(newWebhook.url);
      cy.getByTestId('webhook-save').click();

      cy.wait([
        '@default-webhook-created-successfully',
        `@${state.Webhooks.SINGLE}`,
        `@${state.Webhooks.NO_CALLS}`
      ]);

      cy.getByTestId('cf-notification-container').should(
        'contain',
        `Webhook "${newWebhook.name}" saved successfully.`
      );
    });
  });

  context('webhook, that triggers deletion of asset is configured', () => {
    beforeEach(() => {
      customWebhookSingleEventResponse();
      webhookCallSuccessfulResponse().as('fetch-webhook-calls-was-successful');
      cy.visit(`/spaces/${defaultSpaceId}/settings/webhooks/${defaultWebhookId}`);
      cy.wait([
        `@${state.Token.VALID}`,
        `@${state.Webhooks.SINGLE_EVENT}`,
        '@fetch-webhook-calls-was-successful'
      ]);
    });

    it('renders webhook call result', () => {
      cy.getByTestId('status-indicator').should('be.visible');
      cy.getByTestId('cf-ui-table-row').should('have.length', 1);
    });
  });

  context('webhook with all custom settings is configured', () => {
    beforeEach(() => {
      customWebhookAllSettingsResponse();
      noWebhookCallsResponse();
      cy.visit(`/spaces/${defaultSpaceId}/settings/webhooks/${defaultWebhookId}`);
      cy.wait([`@${state.Webhooks.ALL_SETTINGS}`, `@${state.Webhooks.NO_CALLS}`]);
    });

    it('renders webhook page', () => {
      cy.getByTestId('webhook-settings').click();
      cy.getByTestId('webhook-method-select').should('have.value', 'GET');
      cy.getByTestId('filter-entity-type').should('have.value', 'sys.id');
      cy.getByTestId('filter-operation').should('contain', 'not equals');
      cy.getByTestId('filter-value').should('have.value', 'master');
      cy.get('[data-test-id="setting-row"]').should('have.length', 3);
      cy.getByTestId('custom_header-key').should('have.value', 'custom_header');
      cy.getByTestId('custom_header-value').should('have.value', '123');
      cy.getByTestId('secret_header-key')
        .should('have.value', 'secret_header')
        .and('have.attr', 'disabled');
      cy.getByTestId('secret_header-value').should('have.attr', 'readonly');
      cy.get('[data-test-id="secret_header-value"]')
        .invoke('attr', 'placeholder')
        .should('be.eq', 'Value of this header is secret');
      cy.getByTestId('Authorization-key')
        .should('have.value', 'Authorization')
        .and('have.attr', 'disabled');
      cy.getByTestId('Authorization-value').should('have.attr', 'readonly');
      cy.get('[data-test-id="secret_header-value"]')
        .invoke('attr', 'placeholder')
        .should('be.eq', 'Value of this header is secret');
      cy.getByTestId('content-type-select').should('contain', 'application/json');
      cy.get('.CodeMirror-line').should('have.text', '{}');
    });
  });

  context('removing a webhook', () => {
    beforeEach(() => {
      defaultWebhookResponse();
      noWebhookCallsResponse();
      cy.visit(`/spaces/${defaultSpaceId}/settings/webhooks/${defaultWebhookId}`);
      cy.wait([
        `@${state.Token.VALID}`,
        `@${state.Webhooks.SINGLE}`,
        `@${state.Webhooks.NO_CALLS}`
      ]);
    });

    it('checks that default webhook is removed successfully', () => {
      defaultWebhookDeletedSuccessResponse();
      noWebhooksResponse();

      cy.getByTestId('webhook-settings').click();
      cy.getByTestId('webhook-remove').click();
      cy.getByTestId('remove-webhook-confirm').click();

      cy.wait(['@default-webhook-deleted-successfully', `@${state.Webhooks.NONE}`]);
      cy.verifyNotification('success', `Webhook "${newWebhook.name}" deleted successfully.`);
    });

    //Test will be added after fixing https://contentful.atlassian.net/browse/EXT-981. As currently server error is not handled.
    it.skip('checks that error response is handled properly', () => {
      defaultWebhookDeletedErrorResponse();

      cy.getByTestId('cf-ui-tab')
        .first()
        .click();
      cy.getByTestId('webhook-remove').click();
      cy.getByTestId('remove-webhook-confirm').click();

      cy.wait([`@${state.Webhooks.INTERNAL_SERVER_ERROR}`]);
      cy.verifyNotification('error', ``);
    });
  });
});
