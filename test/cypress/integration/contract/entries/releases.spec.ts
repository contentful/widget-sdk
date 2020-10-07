import {
  getReleasesList,
  deleteRelease,
  getReleaseEntities,
  deleteEntityFromRelease,
  createEmptyRelease,
  validateRelease,
  publishRelease,
} from '../../../interactions/releases';
import { queryForDefaultEntryWithoutEnvironment } from '../../../interactions/entries';
import { queryForDefaultAssets, severalAssetsBody } from '../../../interactions/assets';
import { defaultRequestsMock } from '../../../util/factories';
import { defaultSpaceId, defaultReleaseId } from '../../../util/requests';
import { FeatureFlag } from '../../../util/featureFlag';
import { severalReleases } from '../../../fixtures/responses/releases';

const severalEntriesResponse = require('../../../fixtures/responses/entries-several.json');

describe('Releases', () => {
  let interactions: string[];
  let getReleasesInteraction;
  let getReleaseActionInteraction;

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

        cy.findByTestId('releases-state-message-heading_releases')
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
        cy.findByTestId('confirm').click();

        cy.wait(deleteReleaseInteraction);
        cy.wait(getReleasesInteraction);

        cy.findAllByTestId('cf-ui-notification').should(
          'contain',
          'First release was sucessfully deleted'
        );
      });
    });

    context('several releases with primary actioned', () => {
      beforeEach(() => {
        getReleasesInteraction = getReleasesList.willReturnSeveralFirstActioned();
        getReleaseActionInteraction = publishRelease.willSucceed();

        cy.visit(`/spaces/${defaultSpaceId}/releases`);
        cy.wait(interactions, { timeout: 20000 });
      });

      it('puts the actioned release on the Past tab', () => {
        cy.wait(getReleasesInteraction);
        cy.wait(getReleaseActionInteraction);

        cy.findAllByTestId('release-card')
          .should('exist')
          .should('have.length', severalReleases().items.length - 1);

        cy.get('[aria-controls=PastReleases]').click();

        cy.findAllByTestId('release-card').should('exist').should('have.length', 1);

        cy.findAllByTestId('release-action-badge').should('have.length', 1);
      });
    });

    context('create empty release', () => {
      beforeEach(() => {
        getReleasesInteraction = getReleasesList.willReturnSeveral();

        cy.visit(`/spaces/${defaultSpaceId}/releases`);
        cy.wait(interactions, { timeout: 20000 });
      });

      it('should create a new release', () => {
        const createEmptyReleaseInteraction = createEmptyRelease.willReturnEmptyRelease();
        cy.wait(getReleasesInteraction);

        cy.findByTestId('create-new-release').should('be.visible').click();
        cy.findByTestId('content-release-modal').should('be.visible').click();
        cy.findByTestId('release-name').should('be.visible').type('New Release');
        cy.findAllByTestId('create-release').should('be.enabled').click();

        cy.wait(createEmptyReleaseInteraction);

        cy.findAllByTestId('cf-ui-notification').should(
          'contain',
          'New Release was sucessfully created'
        );

        cy.findByTestId('view-release').should('be.visible').click();
        cy.url().should('contain', `/releases/${defaultReleaseId}`);
      });
    });
  });

  describe('Release Detail Page', () => {
    afterEach(() => {
      cy.resetAllFakeServers();
    });

    context('no entities in the release', () => {
      beforeEach(() => {
        getReleasesInteraction = getReleaseEntities.willReturnNone();
        cy.visit(`/spaces/${defaultSpaceId}/releases/${defaultReleaseId}`);
        cy.wait(interactions, { timeout: 20000 });
      });

      it('shows no entities message for empty release', () => {
        cy.wait(getReleasesInteraction);
        cy.findByTestId('releases-state-message-heading_detail')
          .should('be.visible')
          .should('contain', 'No content in this release');
      });
    });

    context('several entities in the release', () => {
      beforeEach(() => {
        getReleasesInteraction = getReleaseEntities.willReturnSeveral();
        interactions.push(getReleasesInteraction);
        const slowInteractions = [
          queryForDefaultEntryWithoutEnvironment.willFindIt(),
          queryForDefaultAssets.willFindOne(),
        ];

        cy.visit(`/spaces/${defaultSpaceId}/releases/${defaultReleaseId}`);
        cy.wait(interactions, { timeout: 20000 });
        cy.wait(slowInteractions, { timeout: 20000 });
      });

      context('card view', () => {
        it('shows entities in card view', () => {
          cy.findAllByTestId('release-detail-card-view').should('be.visible');
        });

        it('shows entries', () => {
          cy.findAllByTestId('release-entry-card')
            .should('be.visible')
            .should('have.length', severalEntriesResponse.items.length);
        });

        it('shows assets', () => {
          cy.findAllByTestId('release-asset-card')
            .should('be.visible')
            .should('have.length', severalAssetsBody.items.length);
        });

        it('removes entity successfully', () => {
          const deleteEntityInteraction = deleteEntityFromRelease.willSucceed();

          cy.findByTestId('entry_testEntryId_2_remove-release-ddl').click();
          cy.findByTestId('delete-entity').click();

          cy.wait(deleteEntityInteraction);

          cy.findAllByTestId('cf-ui-notification').should(
            'contain',
            'Untitled was removed from Twentieth Release'
          );
        });
      });

      context('list view', () => {
        beforeEach(() => {
          cy.get('select').select('list');
        });

        it('shows list of entries on detailed release page', () => {
          cy.findAllByTestId('entry-row')
            .should('be.visible')
            .should('have.length', severalEntriesResponse.items.length);
        });

        it('shows list of assets on detailed release page', () => {
          cy.findAllByTestId('test-id-assets').click();
          cy.findAllByTestId('asset-row')
            .should('be.visible')
            .should('have.length', severalAssetsBody.items.length);
        });

        it('removes entity successfully', () => {
          const deleteEntityInteraction = deleteEntityFromRelease.willSucceed();

          cy.findByTestId('entry_2_remove-release-ddl').click();
          cy.findByTestId('delete-entity').click();

          cy.wait(deleteEntityInteraction);

          cy.findAllByTestId('cf-ui-notification').should(
            'contain',
            'Untitled was removed from Twentieth Release'
          );
        });
      });

      context('release actions', () => {
        it('succesfully validate a release', () => {
          const validateReleaseInteraction = validateRelease.willSucceed();
          cy.findAllByTestId('validate-release').click();

          cy.wait(validateReleaseInteraction);
          cy.findAllByTestId('cf-ui-notification').should(
            'contain',
            'All content passed validation'
          );
        });

        it('validate a release with errors', () => {
          const validateReleaseInteraction = validateRelease.willFail();
          cy.findAllByTestId('validate-release').click();

          cy.wait(validateReleaseInteraction);
          cy.findAllByTestId('cf-ui-notification').should(
            'contain',
            'Some content did not pass validation'
          );
          cy.findAllByTestId('validation-error').should('be.visible');
        });

        it('succesfully publish a release without errors', () => {
          const publishReleaseInteraction = publishRelease.willReturnIt();
          const releaseActionSucceeded = publishRelease.willSucceed();
          cy.findAllByTestId('publish-release').click();

          cy.wait(publishReleaseInteraction);
          cy.wait(releaseActionSucceeded);
          cy.findAllByTestId('cf-ui-notification').should(
            'contain',
            'Release was published successfully'
          );
        });

        it('fail to publish a release', () => {
          const publishReleaseInteraction = publishRelease.willReturnIt();
          const releaseActionFailed = publishRelease.willFail();
          cy.findAllByTestId('publish-release').click();

          cy.wait(publishReleaseInteraction);
          cy.wait(releaseActionFailed);
          cy.findAllByTestId('cf-ui-notification').should('contain', 'Failed publishing release');
        });

        it('fail to publish a release because of validation errors', () => {
          const publishReleaseInteraction = publishRelease.willFailWithValidationErrors();
          cy.findAllByTestId('publish-release').click();

          cy.wait(publishReleaseInteraction);
          cy.findAllByTestId('cf-ui-notification').should(
            'contain',
            'Some content did not pass validation'
          );
        });
      });
    });
  });
});

function basicServerSetUp(): string[] {
  cy.resetAllFakeServers();

  cy.startFakeServers({
    consumer: 'user_interface',
    providers: ['users', 'releases', 'entries'],
    cors: true,
    pactfileWriteMode: 'merge',
    dir: Cypress.env('pactDir'),
    spec: 2,
  });

  cy.server();

  return defaultRequestsMock();
}
