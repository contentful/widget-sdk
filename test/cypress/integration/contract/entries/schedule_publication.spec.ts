import { defaultRequestsMock } from '../../../util/factories';
import { queryFirst100UsersInDefaultSpace } from '../../../interactions/users';
import {
  getAllPublicContentTypesInDefaultSpace,
  getEditorInterfaceForDefaultContentType,
} from '../../../interactions/content_types';
import {
  getDefaultEntry,
  validateAnEntryValidResponse,
  queryLinksToDefaultEntry,
  getFirst7SnapshotsOfDefaultEntry,
} from '../../../interactions/entries';
import { defaultEntryId, defaultSpaceId } from '../../../util/requests';
import {
  createScheduledPublicationForDefaultSpace,
  cancelDefaultJobInDefaultSpace,
  queryAllScheduledJobsForDefaultEntry,
} from '../../../interactions/jobs';
import { FeatureFlag } from '../../../util/featureFlag';
import {
  queryForTasksInDefaultSpace,
  queryForBasicAppsInDefaultSpace,
  queryForScheduledPublishingOnEntryPage,
  queryForContentTagsInDefaultSpace,
  queryForCustomSidebarInDefaultOrg,
  queryForTeamsInDefaultOrg,
  queryForSelfConfigureSsoInDefaultOrg,
  queryForScimInDefaultOrg,
} from '../../../interactions/product_catalog_features';

describe('Schedule Publication', () => {
  let interactions: string[];
  beforeEach(() => {
    cy.enableFeatureFlags([FeatureFlag.SCHEDULED_PUBLICATION]);
    interactions = basicServerSetUp();
  });

  describe('scheduling a publication', () => {
    beforeEach(() => {
      interactions.push(queryAllScheduledJobsForDefaultEntry.willFindNone());

      cy.visit(`/spaces/${defaultSpaceId}/entries/${defaultEntryId}`);
      cy.wait(interactions, { timeout: 10000 });
    });

    it('submits the new scheduled publication and then re-fetch the list of scheduled publications', () => {
      cy.resetAllFakeServers();

      const validateAnEntryInteraction = validateAnEntryValidResponse.willSucceed();
      const scheduledPubinteraction = createScheduledPublicationForDefaultSpace.willSucceed();

      cy.findByTestId('change-state-menu-trigger').click();
      cy.findByTestId('schedule-publication').click();

      cy.findByTestId('schedule-publication-modal')
        .should('be.visible')
        .find('[data-test-id="schedule-publication"]')
        .first()
        .click();

      cy.wait(validateAnEntryInteraction);
      cy.wait(scheduledPubinteraction);
      cy.findByTestId('scheduled-item').should('have.length', 1);
    });
    it('cannot create more jobs than the set limit', () => {
      const validateAnEntryInteraction = validateAnEntryValidResponse.willSucceed();
      const scheduledPubinteraction = createScheduledPublicationForDefaultSpace.willFailWithMaxPendingJobsError();

      cy.findByTestId('change-state-menu-trigger').click();
      cy.findByTestId('schedule-publication').click();

      cy.findByTestId('schedule-publication-modal')
        .should('be.visible')
        .find('[data-test-id="schedule-publication"]')
        .first()
        .click();

      cy.wait(validateAnEntryInteraction);
      cy.wait(scheduledPubinteraction);
      // eslint-disable-next-line cypress/no-unnecessary-waiting
      cy.wait(500); // extra wait for notification animation 500ms
      cy.findAllByTestId('cf-ui-notification')
        // .should('be.visible') // This is hidden by the modal
        .should('contain', 'There is a limit of 200 scheduled entries');
    });
  });

  describe('cancelling a publication', () => {
    beforeEach(() => {
      interactions.push(queryAllScheduledJobsForDefaultEntry.willFindOnePendingJob());

      cy.visit(`/spaces/${defaultSpaceId}/entries/${defaultEntryId}`);
      cy.wait(interactions, { timeout: 10000 });
    });

    it('cancels publication after clicking on the grey button', () => {
      cy.resetAllFakeServers();

      const interaction = cancelDefaultJobInDefaultSpace.willSucceed();

      cy.findByTestId('cancel-job-ddl').click();
      cy.findByTestId('cancel-job').click();
      cy.findByTestId('job-cancellation-modal')
        .should('be.visible')
        .find('[data-test-id="confirm-job-cancellation"]')
        .first()
        .click();

      cy.wait(interaction);

      cy.findByTestId('change-state-menu-trigger').should('be.visible');
      cy.findByTestId('change-state-published').should('be.enabled');
    });
  });
  describe('error states', () => {
    it('renders error note if the last job is failed', () => {
      interactions.push(queryAllScheduledJobsForDefaultEntry.willFindOneFailedJob());

      cy.visit(`/spaces/${defaultSpaceId}/entries/${defaultEntryId}`);
      cy.wait(interactions, { timeout: 10000 });

      cy.findByTestId('failed-job-note').should('be.visible').should('contain', 'failed');
      cy.findByTestId('change-state-published').should('be.enabled');
    });

    it('renders error note if jobs endpoint returns 500', () => {
      interactions.push(queryAllScheduledJobsForDefaultEntry.willFailWithAnInternalServerError());

      cy.visit(`/spaces/${defaultSpaceId}/entries/${defaultEntryId}`);
      cy.wait(interactions, { timeout: 10000 });

      cy.findByTestId('cf-ui-note').should('be.visible').should('contain', 'refresh');
      cy.findByTestId('change-state-published').should('be.enabled');
    });
  });
});

function basicServerSetUp(): string[] {
  cy.resetAllFakeServers();
  // TODO: move this to a before block
  cy.startFakeServers({
    consumer: 'user_interface',
    providers: ['jobs', 'entries', 'users', 'product_catalog_features'],
    cors: true,
    pactfileWriteMode: 'merge',
    dir: Cypress.env('pactDir'),
    spec: 2,
  });

  cy.server();
  cy.route('**/channel/**', []).as('shareJS');

  return [
    ...defaultRequestsMock({
      publicContentTypesResponse: getAllPublicContentTypesInDefaultSpace.willReturnOne,
    }),
    queryFirst100UsersInDefaultSpace.willFindSeveral(),
    getDefaultEntry.willReturnIt(),
    queryLinksToDefaultEntry.willReturnNone(),
    getFirst7SnapshotsOfDefaultEntry.willReturnNone(),
    getEditorInterfaceForDefaultContentType.willReturnOneWithoutSidebar(),
    queryForTasksInDefaultSpace.willFindFeatureEnabled(),
    queryForBasicAppsInDefaultSpace.willFindFeatureEnabled(),
    queryForScheduledPublishingOnEntryPage.willFindFeatureEnabled(),
    queryForContentTagsInDefaultSpace.willFindFeatureEnabled(),
    queryForCustomSidebarInDefaultOrg.willFindFeatureEnabled(),
    queryForTeamsInDefaultOrg.willFindFeatureEnabled(),
    queryForSelfConfigureSsoInDefaultOrg.willFindFeatureEnabled(),
    queryForScimInDefaultOrg.willFindFeatureEnabled(),
  ];
}
