import { defaultRequestsMock } from '../../../util/factories';
import { defaultSpaceId } from '../../../util/requests';
import {
  queryFirst100WebhooksInDefaultSpace,
  getAllCallsForDefaultWebhook
} from '../../../interactions/webhooks';

describe('Webhooks', () => {
  before(() =>
    cy.startFakeServer({
      consumer: 'user_interface',
      provider: 'webhooks',
      cors: true,
      pactfileWriteMode: 'merge',
      dir: Cypress.env('pactDir'),
      spec: 2
    })
  );

  let interactions: string[];
  beforeEach(() => {
    cy.resetAllFakeServers();

    interactions = defaultRequestsMock();
  });

  context('no webhooks in the space configured', () => {
    beforeEach(() => {
      const slowInteraction = queryFirst100WebhooksInDefaultSpace.willFindNone();

      cy.visit(`/spaces/${defaultSpaceId}/settings/webhooks`);

      cy.wait(interactions);
      cy.wait(slowInteraction, { timeout: 10000 });
    });

    it('renders table and heading', () => {
      cy.getByTestId('cf-ui-table').should('be.visible');
      cy.queryAllByTestId('webhook-row').should('have.length', 0);
    });
  });

  context('server error', () => {
    beforeEach(() => {
      const slowInteraction = queryFirst100WebhooksInDefaultSpace.willFailWithInternalServerError();

      cy.visit(`/spaces/${defaultSpaceId}/settings/webhooks`);

      cy.wait(interactions);
      cy.wait(slowInteraction, { timeout: 10000 });
    });

    it.skip('renders error message', () => {});
    //Test will be added after fixing https://contentful.atlassian.net/browse/EXT-907.
  });

  context('single webhook in the space configured', () => {
    beforeEach(() => {
      const slowInteractions = [
        queryFirst100WebhooksInDefaultSpace.willFindOne(),
        getAllCallsForDefaultWebhook.willReturnNone()
      ];

      cy.visit(`/spaces/${defaultSpaceId}/settings/webhooks`);

      cy.wait(interactions);
      cy.wait(slowInteractions, { timeout: 10000 });
    });

    it('renders title and table raw', () => {
      cy.getAllByTestId('webhook-row').should('have.length', 1);
    });
  });
});
