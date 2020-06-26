import { defaultRequestsMock } from '../../../util/factories';
import { defaultSpaceId } from '../../../util/requests';
import { getAllPublicContentTypesInDefaultSpace } from '../../../interactions/content_types';
import {
  queryPendingJobsForDefaultSpace,
  queryCompletedJobsForDefaultSpace,
  queryFailedJobsForDefaultSpace,
} from '../../../interactions/jobs';
import {
  severalPendingJobsResponse,
  severalCompletedJobsResponse,
  severalFailedJobsResponse,
} from '../../../fixtures/responses/jobs-several';
import { queryForDefaultEntryWithoutEnvironment } from '../../../interactions/entries';
import { queryForDefaultUserDetails, queryForUsers } from '../../../interactions/users';
import { FeatureFlag } from '../../../util/featureFlag';
import {
  queryForCustomSidebarInDefaultOrg,
  queryForTeamsInDefaultOrg,
  queryForSelfConfigureSsoInDefaultOrg,
  queryForScimInDefaultOrg,
  queryForScheduledPublishingInDefaultSpace,
  queryForTasksInDefaultSpace,
  queryForBasicAppsInDefaultSpace,
  queryForContentTagsInDefaultSpace,
} from '../../../interactions/product_catalog_features';

describe('Jobs page', () => {
  before(() =>
    cy.startFakeServers({
      consumer: 'user_interface',
      providers: ['jobs', 'product_catalog_features', 'users'],
      cors: true,
      pactfileWriteMode: 'merge',
      dir: Cypress.env('pactDir'),
      spec: 2,
    })
  );

  beforeEach(() => {
    cy.resetAllFakeServers();
    cy.enableFeatureFlags([FeatureFlag.SCHEDULED_PUBLICATION]);
  });

  context('no jobs in the space', () => {
    beforeEach(() => {
      const interactions = [
        ...defaultRequestsMock(),

        queryForCustomSidebarInDefaultOrg.willFindFeatureEnabled(),
        queryForTeamsInDefaultOrg.willFindFeatureEnabled(),
        queryForSelfConfigureSsoInDefaultOrg.willFindFeatureEnabled(),
        queryForScimInDefaultOrg.willFindFeatureEnabled(),

        queryForTasksInDefaultSpace.willFindFeatureEnabled(),
        queryForScheduledPublishingInDefaultSpace.willFindFeatureEnabled(),
        queryForBasicAppsInDefaultSpace.willFindFeatureEnabled(),
        queryForContentTagsInDefaultSpace.willFindFeatureEnabled(),
      ];
      const slowInteraction = queryPendingJobsForDefaultSpace.willFindNone();

      cy.visit(`/spaces/${defaultSpaceId}/jobs`);

      cy.wait(interactions);
      cy.wait(slowInteraction, { timeout: 10000 });
    });
    it('renders illustration and heading for Scheduled tab empty state', () => {
      cy.findByTestId('cf-ui-tab-panel').should('be.visible').find('svg').should('be.visible');
      cy.findByTestId('jobs-state-message-heading').should('contain', 'Nothing is scheduled');
    });
    it('renders illustration and heading for Completed tab empty state', () => {
      const completedJobsInteraction = queryCompletedJobsForDefaultSpace.willFindNone();
      selectCompletedTab();
      cy.wait(completedJobsInteraction);
      cy.findByTestId('cf-ui-tab-panel').should('be.visible').find('svg').should('be.visible');
      cy.findByTestId('jobs-state-message-heading').should(
        'contain',
        'No entries have been successfully published yet'
      );
    });
    it('renders illustration and heading for Failed tab empty state', () => {
      const failedJobsInteraction = queryFailedJobsForDefaultSpace.willFindNone();
      selectFailedTab();
      cy.wait(failedJobsInteraction);
      cy.findByTestId('cf-ui-tab-panel').should('be.visible').find('svg').should('be.visible');
      cy.findByTestId('jobs-state-message-heading').should('contain', 'Nothing here');
    });
  });

  context('several jobs in the space', () => {
    beforeEach(() => {
      cy.resetAllFakeServers();
      // TODO: move this to a before block
      cy.startFakeServers({
        consumer: 'user_interface',
        providers: ['entries', 'users'],
        cors: true,
        pactfileWriteMode: 'merge',
        dir: Cypress.env('pactDir'),
        spec: 2,
      });
      const interactions = defaultRequestsMock({
        publicContentTypesResponse: getAllPublicContentTypesInDefaultSpace.willReturnOne,
      });
      const slowInteractions = [
        queryPendingJobsForDefaultSpace.willFindSeveral(),
        queryForDefaultEntryWithoutEnvironment.willFindIt(),
        queryForDefaultUserDetails.willFindTheUserDetails(),

        queryForTasksInDefaultSpace.willFindFeatureEnabled(),
        queryForScheduledPublishingInDefaultSpace.willFindFeatureEnabled(),
        queryForBasicAppsInDefaultSpace.willFindFeatureEnabled(),
        queryForContentTagsInDefaultSpace.willFindFeatureEnabled(),

        queryForCustomSidebarInDefaultOrg.willFindFeatureEnabled(),
        queryForTeamsInDefaultOrg.willFindFeatureEnabled(),
        queryForSelfConfigureSsoInDefaultOrg.willFindFeatureEnabled(),
        queryForScimInDefaultOrg.willFindFeatureEnabled(),
      ];

      cy.visit(`/spaces/${defaultSpaceId}/jobs`);
      cy.wait(interactions);
      cy.wait(slowInteractions, {
        timeout: 10000,
      });
    });
    it('renders list of scheduled jobs', () => {
      cy.findByTestId('scheduled-jobs-date-group')
        .should('be.visible')
        .findAllByTestId('cf-ui-entity-list-item')
        .should('have.length', severalPendingJobsResponse().items.length);
    });
    it('renders list of completed jobs', () => {
      const completedJobsInteraction = queryCompletedJobsForDefaultSpace.willFindSeveral();
      selectCompletedTab();
      cy.wait(completedJobsInteraction);
      cy.findByTestId('scheduled-jobs-date-group')
        .should('be.visible')
        .findAllByTestId('cf-ui-entity-list-item')
        .should('have.length', severalCompletedJobsResponse.items.length);
    });
    it('renders list of failed jobs', () => {
      const failedJobsInteraction = queryFailedJobsForDefaultSpace.willFindSeveral();
      const userData = queryForUsers.willFindTheUserDetails();
      selectFailedTab();
      cy.wait(failedJobsInteraction);
      cy.wait(userData);
      cy.findAllByTestId('scheduled-job').should(
        'have.length',
        severalFailedJobsResponse.items.length
      );
      cy.findAllByTestId('cf-ui-tag').should('contain', 'publish failed');
    });
  });

  context('error state', () => {
    beforeEach(() => {
      const slowInteraction = queryPendingJobsForDefaultSpace.willFailWithAnInternalServerError();

      const interactions = [
        ...defaultRequestsMock(),
        queryForTasksInDefaultSpace.willFindFeatureEnabled(),
        queryForScheduledPublishingInDefaultSpace.willFindFeatureEnabled(),
        queryForBasicAppsInDefaultSpace.willFindFeatureEnabled(),
        queryForContentTagsInDefaultSpace.willFindFeatureEnabled(),

        queryForCustomSidebarInDefaultOrg.willFindFeatureEnabled(),
        queryForTeamsInDefaultOrg.willFindFeatureEnabled(),
        queryForSelfConfigureSsoInDefaultOrg.willFindFeatureEnabled(),
        queryForScimInDefaultOrg.willFindFeatureEnabled(),
      ];

      cy.visit(`/spaces/${defaultSpaceId}/jobs`);
      cy.wait(interactions);
      cy.wait(slowInteraction, { timeout: 10000 });
    });
    it('renders illustration and heading for error state', () => {
      cy.findByTestId('cf-ui-tab-panel').should('be.visible').find('svg').should('be.visible');
      cy.findByTestId('cf-ui-jobs-state-error').should('contain', 'Something went wrong');
    });
  });
});
function selectCompletedTab() {
  cy.findAllByTestId('cf-ui-tab').eq(1).click();
}

function selectFailedTab() {
  cy.findAllByTestId('cf-ui-tab').eq(2).click();
}
