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
  defaultWebhookDeletedErrorResponse
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
        `@${state.Webhook.DEFAULT}`,
        `@${state.Webhook.CALLS_NONE}`
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
      webhookCallSuccessfulResponse();
      cy.visit(`/spaces/${defaultSpaceId}/settings/webhooks/${defaultWebhookId}`);
      cy.wait([
        `@${state.Token.VALID}`,
        `@${state.Webhook.SINGLE_EVENT}`,
        `@${state.Webhook.CALL_SUCCESSFUL}`
      ]);
    });

    it('renders webhook call result', () => {
      cy.getByTestId('status-indicator').should('be.visible');
      cy.getByTestId('cf-ui-table-row').should('have.length', 1);
    });
  });

  context('removing a webhook', () => {
    beforeEach(() => {
      defaultWebhookResponse();
      noWebhookCallsResponse();
      cy.visit(`/spaces/${defaultSpaceId}/settings/webhooks/${defaultWebhookId}`);
      cy.wait([
        `@${state.Token.VALID}`,
        `@${state.Webhook.DEFAULT}`,
        `@${state.Webhook.CALLS_NONE}`
      ]);
    });

    it('checks that default webhook is removed successfully', () => {
      defaultWebhookDeletedSuccessResponse();
      noWebhooksResponse();

      cy.getByTestId('webhook-settings').click();
      cy.getByTestId('webhook-remove').click();
      cy.getByTestId('remove-webhook-confirm').click();

      cy.wait([`@${state.Webhooks.NONE}`]);
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

      cy.wait([`@${state.Webhooks.ERROR}`]);
      cy.verifyNotification('error', ``);
    });
  });
});
