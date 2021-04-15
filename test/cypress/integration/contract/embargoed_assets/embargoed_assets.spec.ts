import { defaultSpaceId } from '../../../util/requests';
import { defaultRequestsMock } from '../../../util/factories';
import { getEmbargoedAssets, setEmbargoedAssets } from '../../../interactions/embargoed_assets';

describe('Embargoed Assets settings page', () => {
  let interactions: string[];

  context('as a Space Admin', () => {
    context('with ProductCatalog feature enabled', () => {
      describe('initial mode is DISABLED (null)', () => {
        beforeEach(() => {
          interactions = [...basicServerSetup(), getEmbargoedAssets.willReturnDisabled()];

          cy.visit(`/spaces/${defaultSpaceId}/settings/embargoed-assets`);
          cy.wait(interactions);
        });

        it('renders welcome page and can turn on (set mode/level to MIGRATING)', () => {
          const requests = [setEmbargoedAssets.willChangeToMigrating()];
          cy.findByTestId('get-started').should('be.visible').click();
          cy.wait(requests);
          cy.findByTestId('cf-notification-container').contains('Preparation mode activated');
          cy.findByTestId('embargoed-assets-current-mode').should('have.text', 'Preparation mode');
        });
      });

      describe('initial mode is MIGRATING', () => {
        beforeEach(() => {
          interactions = [
            ...basicServerSetup(),
            getEmbargoedAssets.willReturnEnabledAndMigration(),
          ];

          cy.visit(`/spaces/${defaultSpaceId}/settings/embargoed-assets`);
          cy.wait(interactions);
        });

        it('renders detail page with current mode and URL security labels', () => {
          cy.findByTestId('embargoed-assets-current-mode').should('have.text', 'Preparation mode');
          cy.findByTestId('embargoed-assets-level-table').scrollIntoView();
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

        it('can change mode (level) to UNPUBLISHED', () => {
          const requests = [setEmbargoedAssets.willChangeToUnpublished()];

          cy.findByTestId('embargoed-assets-current-mode').should('have.text', 'Preparation mode');
          cy.findByTestId('turn-on').click();
          cy.findByTestId('change-protection-modal').should('be.visible');
          cy.findByTestId('cf-ui-select').select('unpublished');
          cy.findByText('Save changes')
            .should('be.visible')
            .parents('button')
            .should('be.disabled');
          cy.get('input[id=understand-change]').click();
          cy.findByText('Save changes').parents('button').should('not.be.disabled').click();
          cy.wait(requests);
          cy.findByTestId('cf-notification-container').contains('Unpublished assets protected');
          cy.findByTestId('embargoed-assets-current-mode').should(
            'have.text',
            'Unpublished assets protected'
          );
        });

        it('can change mode (level) to ALL', () => {
          const requests = [setEmbargoedAssets.willChangeToAll()];

          cy.findByTestId('embargoed-assets-current-mode').should('have.text', 'Preparation mode');
          cy.findByTestId('turn-on').click();
          cy.findByTestId('change-protection-modal').should('be.visible');
          cy.findByTestId('cf-ui-select').select('all');
          cy.findByText('Save changes')
            .should('be.visible')
            .parents('button')
            .should('be.disabled');
          cy.get('input[id=understand-change]').click();
          cy.findByText('Save changes').parents('button').should('not.be.disabled').click();
          cy.wait(requests);
          cy.findByTestId('cf-notification-container').contains('All assets protected');
          cy.findByTestId('embargoed-assets-current-mode').should(
            'have.text',
            'All assets protected'
          );
        });

        it('can turn off again', () => {
          const requests = [setEmbargoedAssets.willChangeToDisabled()];

          cy.findByTestId('embargoed-assets-current-mode').should('have.text', 'Preparation mode');
          cy.findByTestId('turn-off').click();
          cy.findByTestId('turn-off-modal').should('be.visible');
          cy.findByText('Make all assets unprotected')
            .should('be.visible')
            .parents('button')
            .should('be.disabled');
          cy.get('input[id=understand-change]').click();
          cy.findByText('Make all assets unprotected')
            .parents('button')
            .should('not.be.disabled')
            .click();
          cy.wait(requests);
          cy.findByTestId('cf-notification-container').contains('Embargoed assets turned off');
          cy.findByTestId('get-started').should('be.visible');
        });
      });

      describe('initial mode is UNPUBLISHED', () => {
        beforeEach(() => {
          interactions = [
            ...basicServerSetup(),
            getEmbargoedAssets.willReturnEnabledForUnpublished(),
          ];

          cy.visit(`/spaces/${defaultSpaceId}/settings/embargoed-assets`);
          cy.wait(interactions);
        });

        it('renders detail page with current mode and URL security labels', () => {
          cy.findByTestId('embargoed-assets-current-mode').should(
            'have.text',
            'Unpublished assets protected'
          );
          cy.findByTestId('embargoed-assets-level-table').scrollIntoView();
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

        it('can change mode (level) to MIGRATING', () => {
          const requests = [setEmbargoedAssets.willChangeToMigrating()];

          cy.findByTestId('embargoed-assets-current-mode').should(
            'have.text',
            'Unpublished assets protected'
          );
          cy.findByTestId('turn-on').click();
          cy.findByTestId('change-protection-modal').should('be.visible');
          cy.findByTestId('cf-ui-select').select('migrating');
          cy.findByText('Save changes')
            .should('be.visible')
            .parents('button')
            .should('be.disabled');
          cy.get('input[id=understand-change]').click();
          cy.findByText('Save changes').parents('button').should('not.be.disabled').click();
          cy.wait(requests);
          cy.findByTestId('cf-notification-container').contains('Preparation mode activated');
          cy.findByTestId('embargoed-assets-current-mode').should('have.text', 'Preparation mode');
        });

        it('can change mode (level) to ALL', () => {
          const requests = [setEmbargoedAssets.willChangeToAll()];

          cy.findByTestId('embargoed-assets-current-mode').should(
            'have.text',
            'Unpublished assets protected'
          );
          cy.findByTestId('turn-on').click();
          cy.findByTestId('change-protection-modal').should('be.visible');
          cy.findByTestId('cf-ui-select').select('all');
          cy.findByText('Save changes')
            .should('be.visible')
            .parents('button')
            .should('be.disabled');
          cy.get('input[id=understand-change]').click();
          cy.findByText('Save changes').parents('button').should('not.be.disabled').click();
          cy.wait(requests);
          cy.findByTestId('cf-notification-container').contains('All assets protected');
          cy.findByTestId('embargoed-assets-current-mode').should(
            'have.text',
            'All assets protected'
          );
        });

        it('can turn off again', () => {
          const requests = [setEmbargoedAssets.willChangeToDisabled()];

          cy.findByTestId('embargoed-assets-current-mode').should(
            'have.text',
            'Unpublished assets protected'
          );
          cy.findByTestId('turn-off').click();
          cy.findByTestId('turn-off-modal').should('be.visible');
          cy.findByText('Make all assets unprotected')
            .should('be.visible')
            .parents('button')
            .should('be.disabled');
          cy.get('input[id=understand-change]').click();
          cy.findByText('Make all assets unprotected')
            .parents('button')
            .should('not.be.disabled')
            .click();
          cy.wait(requests);
          cy.findByTestId('cf-notification-container').contains('Embargoed assets turned off');
          cy.findByTestId('get-started').should('be.visible');
        });
      });

      describe('initial mode is ALL', () => {
        beforeEach(() => {
          interactions = [...basicServerSetup(), getEmbargoedAssets.willReturnEnabledForAll()];

          cy.visit(`/spaces/${defaultSpaceId}/settings/embargoed-assets`);
          cy.wait(interactions);
        });

        it('renders detail page with current mode and URL security labels', () => {
          cy.findByTestId('embargoed-assets-current-mode').should(
            'have.text',
            'All assets protected'
          );
          cy.findByTestId('embargoed-assets-level-table').scrollIntoView();
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

        it('can change mode (level) to MIGRATING', () => {
          const requests = [setEmbargoedAssets.willChangeToMigrating()];

          cy.findByTestId('embargoed-assets-current-mode').should(
            'have.text',
            'All assets protected'
          );
          cy.findByTestId('turn-on').click();
          cy.findByTestId('change-protection-modal').should('be.visible');
          cy.findByTestId('cf-ui-select').select('migrating');
          cy.findByText('Save changes')
            .should('be.visible')
            .parents('button')
            .should('be.disabled');
          cy.get('input[id=understand-change]').click();
          cy.findByText('Save changes').parents('button').should('not.be.disabled').click();
          cy.wait(requests);
          cy.findByTestId('cf-notification-container').contains('Preparation mode activated');
          cy.findByTestId('embargoed-assets-current-mode').should('have.text', 'Preparation mode');
        });

        it('can change mode (level) to UNPUBLISHED', () => {
          const requests = [setEmbargoedAssets.willChangeToUnpublished()];

          cy.findByTestId('embargoed-assets-current-mode').should(
            'have.text',
            'All assets protected'
          );
          cy.findByTestId('turn-on').click();
          cy.findByTestId('change-protection-modal').should('be.visible');
          cy.findByTestId('cf-ui-select').select('unpublished');
          cy.findByText('Save changes')
            .should('be.visible')
            .parents('button')
            .should('be.disabled');
          cy.get('input[id=understand-change]').click();
          cy.findByText('Save changes').parents('button').should('not.be.disabled').click();
          cy.wait(requests);
          cy.findByTestId('cf-notification-container').contains('Unpublished assets protected');
          cy.findByTestId('embargoed-assets-current-mode').should(
            'have.text',
            'Unpublished assets protected'
          );
        });

        it('can turn off again', () => {
          const requests = [setEmbargoedAssets.willChangeToDisabled()];

          cy.findByTestId('embargoed-assets-current-mode').should(
            'have.text',
            'All assets protected'
          );
          cy.findByTestId('turn-off').click();
          cy.findByTestId('turn-off-modal').should('be.visible');
          cy.findByText('Make all assets unprotected')
            .should('be.visible')
            .parents('button')
            .should('be.disabled');
          cy.get('input[id=understand-change]').click();
          cy.findByText('Make all assets unprotected')
            .parents('button')
            .should('not.be.disabled')
            .click();
          cy.wait(requests);
          cy.findByTestId('cf-notification-container').contains('Embargoed assets turned off');
          cy.findByTestId('get-started').should('be.visible');
        });
      });
    });

    context('with ProductCatalog feature disabled', () => {
      beforeEach(() => {
        interactions = [...basicServerSetup(), getEmbargoedAssets.willReturnDenied()];

        cy.visit(`/spaces/${defaultSpaceId}/settings/embargoed-assets`);
        cy.wait(interactions);
      });

      it('renders card to get in contact with us', () => {
        cy.findByTestId('get-in-touch').should('be.visible');
      });
    });
  });

  // TODO: Is that even possible? (seems default user is always a space admin)
  context('as any other role', () => {
    beforeEach(() => {
      interactions = basicServerSetup({});
      cy.visit(`/spaces/${defaultSpaceId}/settings/embargoed-assets`);
      cy.wait(interactions);
    });

    it.skip('does not allow any access', () => {
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
