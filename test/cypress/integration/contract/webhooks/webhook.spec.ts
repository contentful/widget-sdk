import { defaultRequestsMock } from '../../../util/factories';
import * as state from '../../../util/interactionState';
import { defaultSpaceId } from '../../../util/requests';
import {
  defaultWebhookCreatedSuccessResponse,
  defaultWebhookResponse,
  noWebhookCallsResponse
} from '../../../interactions/webhooks';

describe('Webhook', () => {
  before(() =>
    cy.startFakeServer({
      consumer: 'user_interface',
      provider: 'webhooks',
      cors: true,
      pactfileWriteMode: 'merge'
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

    const newWebhook = {
      name: 'Webhook',
      url: 'https://www.contentful.com/'
    };

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
});
