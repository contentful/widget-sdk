import { defaultRequestsMock } from '../../../util/factories';
import { defaultSpaceId, defaultWebhookId } from '../../../util/requests';
import {
  createDefaultWebhook,
  getDefaultWebhook,
  queryFirst500DefaultWebhookCalls,
  deleteDefaultWebhook,
  queryFirst100WebhooksInDefaultSpace,
  createCustomWebhookTriggeringContentTypeEvents,
  createCustomWebhookWithFilters,
  createCustomWebhookWithCustomHeader,
  createCustomWebhookWithSecretHeader,
  createCustomWebhookWithHTTPHeader,
  createCustomWebhookWithContentTypeHeader,
  createCustomWebhookWithContentLengthHeader,
  createCustomWebhookWithCustomPayload,
} from '../../../interactions/webhooks';

describe('Webhook', () => {
  const defaultWebhook = {
    name: 'Webhook',
    method: 'GET',
    url: 'https://www.contentful.com/',
  };

  function fillInDefaultWebhookDetails() {
    cy.get('#webhook-name').type(defaultWebhook.name);
    cy.get('#webhook-url').type(defaultWebhook.url);
    cy.findByTestId('webhook-method-select').select(defaultWebhook.method);
  }

  before(() =>
    cy.startFakeServer({
      consumer: 'user_interface',
      provider: 'webhooks',
      cors: true,
      pactfileWriteMode: 'merge',
      dir: Cypress.env('pactDir'),
      spec: 2,
    })
  );

  let interactions: string[];
  beforeEach(() => {
    cy.resetAllFakeServers();

    interactions = defaultRequestsMock();
  });

  context('creating a new webhook', () => {
    beforeEach(() => {
      cy.visit(`/spaces/${defaultSpaceId}/settings/webhooks/new`);

      cy.wait(interactions);
    });

    it('checks that default webhook is successfully created', () => {
      const extraInteractions = [
        createDefaultWebhook.willSucceed(),
        getDefaultWebhook.willReturnTheDefaultWebhook(),
        queryFirst500DefaultWebhookCalls.willReturnNone(),
      ];

      fillInDefaultWebhookDetails();
      cy.findByTestId('webhook-save').click();

      cy.wait(extraInteractions);

      cy.verifyNotification('success', `Webhook "${defaultWebhook.name}" saved successfully.`);
    });

    it('checks that webhook, which triggers ContentType events, is successfully created', () => {
      const extraInteractions = [
        createCustomWebhookTriggeringContentTypeEvents.willSucceed(),
        getDefaultWebhook.willReturnACustomWebhookThatTriggersContentTypeEvents(),
        queryFirst500DefaultWebhookCalls.willReturnNone(),
      ];

      fillInDefaultWebhookDetails();
      cy.get("[data-test-id='webhook-editor-setting-option']").eq(1).click();
      cy.get("[data-test-id='checkbox-row']").eq(0).click();
      cy.findByTestId('webhook-save').click();

      cy.wait(extraInteractions);

      cy.verifyNotification('success', `Webhook "${defaultWebhook.name}" saved successfully.`);
    });

    it('checks that webhook with filter is successfully created', () => {
      const extraInteractions = [
        createCustomWebhookWithFilters.willSucceed(),
        getDefaultWebhook.willReturnACustomWebhookWithFilter(),
        queryFirst500DefaultWebhookCalls.willReturnNone(),
      ];

      fillInDefaultWebhookDetails();
      cy.findByTestId('filter-entity-type').select('Entity ID (sys.id)');
      cy.findByTestId('filter-operation').select('in');
      cy.findByTestId('webhook-save').click();

      cy.wait(extraInteractions);

      cy.verifyNotification('success', `Webhook "${defaultWebhook.name}" saved successfully.`);
    });

    it('checks that webhook with custom header is successfully created', () => {
      const extraInteractions = [
        createCustomWebhookWithCustomHeader.willSucceed(),
        getDefaultWebhook.willReturnACustomWebhookWithCustomHeader(),
        queryFirst500DefaultWebhookCalls.willReturnNone(),
      ];

      fillInDefaultWebhookDetails();
      cy.findByTestId('add-custom-header').click();
      cy.findByTestId('0-key').type('key');
      cy.findByTestId('0-value').type('value');
      cy.findByTestId('webhook-save').click();

      cy.wait(extraInteractions);

      cy.verifyNotification('success', `Webhook "${defaultWebhook.name}" saved successfully.`);
    });

    it('checks that webhook with secret header is successfully created', () => {
      const extraInteractions = [
        createCustomWebhookWithSecretHeader.willSucceed(),
        getDefaultWebhook.willReturnACustomWebhookWithSecretHeader(),
        queryFirst500DefaultWebhookCalls.willReturnNone(),
      ];

      fillInDefaultWebhookDetails();
      cy.findByTestId('add-secret-header').click();
      cy.get('#secret-header-key').type('key');
      cy.get('#secret-header-value').type('value');
      cy.findByTestId('add-secret-header-button').click();
      cy.findByTestId('webhook-save').click();

      cy.wait(extraInteractions);

      cy.verifyNotification('success', `Webhook "${defaultWebhook.name}" saved successfully.`);
    });

    it('checks that webhook with HTTP header is successfully created', () => {
      const extraInteractions = [
        createCustomWebhookWithHTTPHeader.willSucceed(),
        getDefaultWebhook.willReturnACustomWebhookWithHTTPHeader(),
        queryFirst500DefaultWebhookCalls.willReturnNone(),
      ];

      fillInDefaultWebhookDetails();
      cy.findByTestId('add-http-basic-url-header').click();
      cy.get('#http-basic-user').type('user');
      cy.get('#http-basic-password').type('password');
      cy.findByTestId('add-http-header-button').click();
      cy.findByTestId('webhook-save').click();

      cy.wait(extraInteractions);

      cy.verifyNotification('success', `Webhook "${defaultWebhook.name}" saved successfully.`);
    });

    it('checks that webhook with content type header is successfully created', () => {
      const extraInteractions = [
        createCustomWebhookWithContentTypeHeader.willSucceed(),
        getDefaultWebhook.willReturnACustomWebhookWithContentTypeHeader(),
        queryFirst500DefaultWebhookCalls.willReturnNone(),
      ];

      fillInDefaultWebhookDetails();
      cy.findByTestId('content-type-select').select('application/json');
      cy.findByTestId('webhook-save').click();

      cy.wait(extraInteractions);

      cy.verifyNotification('success', `Webhook "${defaultWebhook.name}" saved successfully.`);
    });

    it('checks that webhook with content length header is successfully created', () => {
      const extraInteractions = [
        createCustomWebhookWithContentLengthHeader.willSucceed(),
        getDefaultWebhook.willReturnACustomWebhookWithContentLengthHeader(),
        queryFirst500DefaultWebhookCalls.willReturnNone(),
      ];

      fillInDefaultWebhookDetails();
      cy.get('#webhook-content-length').click();
      cy.findByTestId('webhook-save').click();

      cy.wait(extraInteractions);

      cy.verifyNotification('success', `Webhook "${defaultWebhook.name}" saved successfully.`);
    });

    it('checks that webhook with custom payload is successfully created', () => {
      const extraInteractions = [
        createCustomWebhookWithCustomPayload.willSucceed(),
        getDefaultWebhook.willReturnACustomWebhookWithPayload(),
        queryFirst500DefaultWebhookCalls.willReturnNone(),
      ];

      fillInDefaultWebhookDetails();
      cy.findAllByTestId('customize-webhook-payload').click();
      cy.get('.CodeMirror textarea').type('{}', { force: true });
      cy.findByTestId('webhook-save').click();

      cy.wait(extraInteractions);

      cy.verifyNotification('success', `Webhook "${defaultWebhook.name}" saved successfully.`);
    });
  });

  context('webhook, that triggers deletion of asset is configured', () => {
    beforeEach(() => {
      interactions.push(
        getDefaultWebhook.willReturnACustomWebhookWithSingleEvent(),
        queryFirst500DefaultWebhookCalls.willReturnOneSuccesfulCall()
      );

      cy.visit(`/spaces/${defaultSpaceId}/settings/webhooks/${defaultWebhookId}`);

      cy.wait(interactions);
    });

    it('renders webhook call result', () => {
      cy.findByTestId('status-indicator').should('be.visible');
      cy.findByTestId('cf-ui-table-body').findByTestId('cf-ui-table-row').should('have.length', 1);
    });
  });

  context('webhook with all custom settings is configured', () => {
    beforeEach(() => {
      interactions.push(
        getDefaultWebhook.willReturnACustomWebhookWithAllSetting(),
        queryFirst500DefaultWebhookCalls.willReturnNone()
      );

      cy.visit(`/spaces/${defaultSpaceId}/settings/webhooks/${defaultWebhookId}`);

      cy.wait(interactions);
    });

    it('renders webhook page', () => {
      cy.findByTestId('webhook-settings-tab').click();
      cy.findByTestId('webhook-method-select').should('have.value', 'GET');
      cy.findByTestId('filter-entity-type').should('have.value', 'sys.id');
      cy.findByTestId('filter-operation').should('contain', 'not equals');
      cy.findByTestId('filter-value').should('have.value', 'master');
      cy.get('[data-test-id="setting-row"]').should('have.length', 3);
      cy.findByTestId('0-key').should('have.value', 'custom_header');
      cy.findByTestId('0-value').should('have.value', '123');
      cy.findByTestId('1-key').should('have.value', 'secret_header').and('have.attr', 'disabled');
      cy.findByTestId('1-value').should('have.attr', 'readonly');
      cy.get('[data-test-id="1-value"]')
        .invoke('attr', 'placeholder')
        .should('be.eq', 'Value of this header is secret');
      cy.findByTestId('2-key').should('have.value', 'Authorization').and('have.attr', 'disabled');
      cy.findByTestId('2-value').should('have.attr', 'readonly');
      cy.get('[data-test-id="2-value"]')
        .invoke('attr', 'placeholder')
        .should('be.eq', 'Value of this header is secret');
      cy.findByTestId('content-type-select').should('contain', 'application/json');
      cy.get('.CodeMirror-line').should('have.text', '{}');
    });
  });

  context('removing a webhook', () => {
    beforeEach(() => {
      interactions.push(
        getDefaultWebhook.willReturnTheDefaultWebhook(),
        queryFirst500DefaultWebhookCalls.willReturnNone()
      );

      cy.visit(`/spaces/${defaultSpaceId}/settings/webhooks/${defaultWebhookId}`);

      cy.wait(interactions);
    });

    it('checks that default webhook is removed successfully', () => {
      const extraInteractions = [
        deleteDefaultWebhook.willSucceed(),
        queryFirst100WebhooksInDefaultSpace.willFindNone(),
      ];

      cy.findByTestId('webhook-settings-tab').click();
      cy.findByTestId('webhook-remove').click();
      cy.findByTestId('remove-webhook-confirm').click();

      cy.wait(extraInteractions);

      cy.verifyNotification('success', `Webhook "${defaultWebhook.name}" deleted successfully.`);
    });

    //Test will be added after fixing https://contentful.atlassian.net/browse/EXT-981. As currently server error is not handled.
    it.skip('checks that error response is handled properly', () => {
      const deleteInteraction = deleteDefaultWebhook.willFailWithAnInternalServerError();

      cy.findByTestId('cf-ui-tab').first().click();
      cy.findByTestId('webhook-remove').click();
      cy.findByTestId('remove-webhook-confirm').click();

      cy.wait(deleteInteraction);

      cy.verifyNotification('error', ``);
    });
  });
});
