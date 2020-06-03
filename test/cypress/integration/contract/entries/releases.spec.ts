import { getReleasesList, deleteRelease } from '../../../interactions/releases';
import { defaultRequestsMock } from '../../../util/factories';
import { defaultSpaceId } from '../../../util/requests';
import { FeatureFlag } from '../../../util/featureFlag';
import { severalReleases } from '../../../fixtures/responses/releases';

describe('Releases', () => {
  let interactions: string[];
  let getReleasesInteraction;

  beforeEach(() => {
    cy.enableFeatureFlags([FeatureFlag.ADD_TO_RELEASE]);
    interactions = basicServerSetUp();
  });

  describe('Releases page', () => {
    afterEach(() => {
      cy.resetAllFakeServers();
    });

    context('no releases', () => {
      beforeEach(() => {
        getReleasesInteraction = getReleasesList.willReturnNone();

        cy.visit(`/spaces/${defaultSpaceId}/releases`);
        cy.wait(interactions, { timeout: 20000 });
      });

      it('opens releases page successfully', () => {
        cy.wait(getReleasesInteraction);

        cy.findByTestId('releases-state-message-heading')
          .should('be.visible')
          .should('contain', 'No upcoming releases at the moment');
      });
    });

    context('several releases', () => {
      beforeEach(() => {
        getReleasesInteraction = getReleasesList.willReturnSeveral();

        cy.visit(`/spaces/${defaultSpaceId}/releases`);
        cy.wait(interactions, { timeout: 20000 });
      });

      it('opens releases page successfully', () => {
        cy.wait(getReleasesInteraction);

        cy.findAllByTestId('release-card')
          .should('exist')
          .should('have.length', severalReleases().items.length);
      });

      it('removes releases successfully', () => {
        const deleteReleaseInteraction = deleteRelease.willSucceed();

        cy.wait(getReleasesInteraction);

        cy.get("[data-test-id='release-card']")
          .eq(0)
          .find("[data-test-id='remove-release-ddl']")
          .click();

        cy.findByTestId('release-card-delete-cta').click();

        cy.wait(deleteReleaseInteraction);
        cy.wait(getReleasesInteraction);

        cy.findAllByTestId('cf-ui-notification').should(
          'contain',
          'First release was sucessfully deleted'
        );
      });
    });
  });
});

function basicServerSetUp(): string[] {
  cy.resetAllFakeServers();

  cy.startFakeServers({
    consumer: 'user_interface',
    providers: ['users', 'releases'],
    cors: true,
    pactfileWriteMode: 'merge',
    dir: Cypress.env('pactDir'),
    spec: 2,
  });

  cy.server();

  return defaultRequestsMock();
}
