import { defaultRequestsMock } from '../../../util/factories';
import * as state from '../../../util/interactionState';
import { defaultSpaceId } from '../../../util/requests';
import { queryFirst100WebhooksInDefaultSpace } from '../../../interactions/webhooks';

const baseUrl = Cypress.config().baseUrl;

describe('Webhooks List Page', () => {
  before(() =>
    cy.startFakeServer({
      consumer: 'user_interface',
      provider: 'webhooks',
      spec: 2
    })
  );

  beforeEach(() => {
    cy.resetAllFakeServers();
    defaultRequestsMock();
  });

  context('no webhooks in the space configured', () => {
    beforeEach(() => {
      queryFirst100WebhooksInDefaultSpace.willFindNone();

      cy.visit(`/spaces/${defaultSpaceId}/settings/webhooks`);
      cy.wait([`@${state.Token.VALID}`]);
      cy.wait([`@${state.Webhooks.NONE}`], { timeout: 10000 });
    });

    it('redirects to new webhook page after clicking "Add Webhook" button', () => {
      cy.getByTestId('add-webhook-button').click();
      cy.getByTestId('workbench-title')
        .should('contain', 'Webhook:')
        .url()
        .should('eq', `${baseUrl}/spaces/${defaultSpaceId}/settings/webhooks/new`);
    });
  });
});
