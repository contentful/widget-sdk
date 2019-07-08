import { defaultRequestsMock } from '../../../util/factories';
import * as state from '../../../util/interactionState';
import { defaultSpaceId } from '../../../util/requests';
import {
  noWebhooksResponse,
  webhooksErrorResponse,
  singleWebhookResponse,
  noWebhooksCallsResponse
} from '../../../interactions/webhooks';

describe('Webhooks', () => {
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

  context('no webhooks in the space configured', () => {
    beforeEach(() => {
      noWebhooksResponse();

      cy.visit(`/spaces/${defaultSpaceId}/settings/webhooks`);
      cy.wait([`@${state.Token.VALID}`]);
      cy.wait([`@${state.Webhooks.NONE}`], { timeout: 10000 });
    });

    it('renders table and heading', () => {
      cy.getByTestId('workbench-title')
        .should('be.visible')
        .and('contain', 'Webhooks (0)');
      cy.getByTestId('cf-ui-table').should('be.visible');
    });
  });

  context('server error', () => {
    beforeEach(() => {
      webhooksErrorResponse();

      cy.visit(`/spaces/${defaultSpaceId}/settings/webhooks`);
      cy.wait([`@${state.Token.VALID}`]);
      cy.wait([`@${state.Webhooks.ERROR}`], { timeout: 10000 });
    });

    it.skip('renders error message', () => {});
    //Test will be added after fixing https://contentful.atlassian.net/browse/EXT-907.
  });

  context('single webhook in the space configured', () => {
    beforeEach(() => {
      singleWebhookResponse();
      noWebhooksCallsResponse();

      cy.visit(`/spaces/${defaultSpaceId}/settings/webhooks`);
      cy.wait([`@${state.Token.VALID}`]);
      cy.wait([`@${state.Webhooks.SINGLE}`], { timeout: 10000 });
    });

    it('renders title and table raw', () => {
      cy.getByTestId('workbench-title')
        .should('be.visible')
        .and('contain', 'Webhooks (1)');
      cy.getByTestId('webhook-row').should('have.length', 1);
    });
  });
});
