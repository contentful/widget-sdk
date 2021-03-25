import { defaultSpaceId } from '../../../util/requests';
import { defaultRequestsMock } from '../../../util/factories';
import { getEmboargoedAssets } from '../../../interactions/embargoed_assets';

describe('Embargoed Assets settings page', () => {
  let interactions: string[];

  context('as a Space Admin', () => {
    context('with ProductCatalog feature enabled', () => {
      describe('initial mode is DISABLED (null)', () => {
        beforeEach(() => {
          interactions = [...basicServerSetup(), getEmboargoedAssets.willReturnDisabled()];

          cy.visit(`/spaces/${defaultSpaceId}/settings/embargoed-assets`);
          cy.wait(interactions);
        });

        it('renders card to started with the feature', () => {
          cy.findByTestId('get-started').should('be.visible');
        });
      });

      describe('initial mode is MIGRATING', () => {
        beforeEach(() => {
          interactions = [
            ...basicServerSetup(),
            getEmboargoedAssets.willReturnEnabledAndMigration(),
          ];

          cy.visit(`/spaces/${defaultSpaceId}/settings/embargoed-assets`);
          cy.wait(interactions);
        });

        it('renders detail page with current mode and URL security labels', () => {
          cy.findByTestId('embargoed-assets-current-mode').should('have.text', 'Preparation mode');
          cy.findByTestId('embargoed-assets.cma')
            .should('be.visible')
            .findByTestId('cf-ui-tag')
            .should('have.text', 'PUBLIC');
          cy.findByTestId('embargoed-assets.cpa')
            .should('be.visible')
            .findByTestId('cf-ui-tag')
            .should('have.text', 'PUBLIC');
          cy.findByTestId('embargoed-assets.cda')
            .should('be.visible')
            .findByTestId('cf-ui-tag')
            .should('have.text', 'PUBLIC');
        });
      });

      describe('initial mode is UNPUBLISHED', () => {
        beforeEach(() => {
          interactions = [
            ...basicServerSetup(),
            getEmboargoedAssets.willReturnEnabledForUnpublished(),
          ];

          cy.visit(`/spaces/${defaultSpaceId}/settings/embargoed-assets`);
          cy.wait(interactions);
        });

        it('renders detail page with current mode and URL security labels', () => {
          cy.findByTestId('embargoed-assets-current-mode').should(
            'have.text',
            'Unpublished assets protected'
          );
          cy.findByTestId('embargoed-assets.cma')
            .should('be.visible')
            .findByTestId('cf-ui-tag')
            .should('have.text', 'SECURE');
          cy.findByTestId('embargoed-assets.cpa')
            .should('be.visible')
            .findByTestId('cf-ui-tag')
            .should('have.text', 'SECURE');
          cy.findByTestId('embargoed-assets.cda')
            .should('be.visible')
            .findByTestId('cf-ui-tag')
            .should('have.text', 'PUBLIC');
        });
      });

      describe('initial mode is ALL', () => {
        beforeEach(() => {
          interactions = [...basicServerSetup(), getEmboargoedAssets.willReturnEnabledForAll()];

          cy.visit(`/spaces/${defaultSpaceId}/settings/embargoed-assets`);
          cy.wait(interactions);
        });

        it('renders detail page with current mode and URL security labels', () => {
          cy.findByTestId('embargoed-assets-current-mode').should(
            'have.text',
            'All assets protected'
          );
          cy.findByTestId('embargoed-assets.cma')
            .should('be.visible')
            .findByTestId('cf-ui-tag')
            .should('have.text', 'SECURE');
          cy.findByTestId('embargoed-assets.cpa')
            .should('be.visible')
            .findByTestId('cf-ui-tag')
            .should('have.text', 'SECURE');
          cy.findByTestId('embargoed-assets.cda')
            .should('be.visible')
            .findByTestId('cf-ui-tag')
            .should('have.text', 'SECURE');
        });
      });
    });

    context('with ProductCatalog feature disabled', () => {
      beforeEach(() => {
        interactions = [...basicServerSetup(), getEmboargoedAssets.willReturnDenied()];

        cy.visit(`/spaces/${defaultSpaceId}/settings/embargoed-assets`);
        cy.wait(interactions);
      });

      it('renders card to get in contact with us', () => {
        cy.findByTestId('get-in-touch').should('be.visible');
      });
    });
  });

  // TODO: Is that even possible? (seems default user is always a space admin)
  context.skip('as any other role', () => {
    beforeEach(() => {
      interactions = basicServerSetup({});
      cy.visit(`/spaces/${defaultSpaceId}/settings/embargoed-assets`);
      cy.wait(interactions);
    });

    it('does not allow any access', () => {
      /* ??? */
    });
  });
});

function basicServerSetup(customHandlers: {} = {}): string[] {
  cy.resetAllFakeServers();
  cy.startFakeServers({
    consumer: 'user_interface',
    providers: ['users', 'embargoed_assets'],
    cors: true,
    pactfileWriteMode: 'merge',
    dir: Cypress.env('pactDir'),
    spec: 2,
  });

  cy.server();
  cy.route('**/channel/**', []).as('shareJS');

  return [...defaultRequestsMock(customHandlers)];
}
