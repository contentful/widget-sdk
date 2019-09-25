import { defaultRequestsMock } from '../../../util/factories';
import { queryFirst100UsersInDefaultSpace } from '../../../interactions/users';
import {
  getAllPublicContentTypesInDefaultSpace,
  getEditorInterfaceForDefaultContentType
} from '../../../interactions/content_types';
import {
  getDefaultEntry,
  validateAnEntryValidResponse,
  queryLinksToDefaultEntry,
  getFirst7SnapshotsOfDefaultEntry
} from '../../../interactions/entries';
import { defaultEntryId, defaultSpaceId } from '../../../util/requests';
import {
  createScheduledPublicationForDefaultSpace,
  cancelDefaultJobInDefaultSpace,
  queryAllScheduledJobsForDefaultEntry
} from '../../../interactions/jobs';
import { FeatureFlag } from '../../../util/featureFlag';

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

      cy.getByTestId('change-state-menu-trigger').click();
      cy.getByTestId('schedule-publication').click();

      cy.getByTestId('schedule-publication-modal')
        .should('be.visible')
        .find('[data-test-id="schedule-publication"]')
        .first()
        .click();

      cy.wait(validateAnEntryInteraction);
      cy.wait(scheduledPubinteraction);
      cy.getByTestId('scheduled-item').should('have.length', 1);
    });
    it('cannot create more jobs than the set limit', () => {
      const validateAnEntryInteraction = validateAnEntryValidResponse.willSucceed();
      const scheduledPubinteraction = createScheduledPublicationForDefaultSpace.willFailWithMaxPendingJobsError();

      cy.getByTestId('change-state-menu-trigger').click();
      cy.getByTestId('schedule-publication').click();

      cy.getByTestId('schedule-publication-modal')
        .should('be.visible')
        .find('[data-test-id="schedule-publication"]')
        .first()
        .click();

      cy.wait(validateAnEntryInteraction);
      cy.wait(scheduledPubinteraction);
      cy.wait(200); // extra wait for notification animation 200ms
      cy.getAllByTestId('cf-ui-notification')
        .should('be.visible')
        .should('contain', 'There is a limit of 10 scheduled entries');
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

      cy.getByTestId('cancel-job-ddl').click();
      cy.getByTestId('cancel-job').click();
      cy.getByTestId('job-cancellation-modal')
        .should('be.visible')
        .find('[data-test-id="confirm-job-cancellation"]')
        .first()
        .click();

      cy.wait(interaction);

      cy.getByTestId('change-state-menu-trigger').should('be.visible');
      cy.getByTestId('change-state-published').should('be.enabled');
    });
  });
  describe('error states', () => {
    it('renders error note is the last job is failed', () => {
      interactions.push(queryAllScheduledJobsForDefaultEntry.willFindOneFailedJob());

      cy.visit(`/spaces/${defaultSpaceId}/entries/${defaultEntryId}`);
      cy.wait(interactions, { timeout: 10000 });

      cy.getByTestId('failed-job-note')
        .should('be.visible')
        .should('contain', 'failed');
      cy.getByTestId('change-state-published').should('be.enabled');
    });

    it('renders error note if jobs endpoint returns 500', () => {
      interactions.push(queryAllScheduledJobsForDefaultEntry.willFailWithAnInternalServerError());

      cy.visit(`/spaces/${defaultSpaceId}/entries/${defaultEntryId}`);
      cy.wait(interactions, { timeout: 10000 });

      cy.getByTestId('cf-ui-note')
        .should('be.visible')
        .should('contain', 'refresh');
      cy.getByTestId('change-state-published').should('be.enabled');
    });
  });
});

function basicServerSetUp(): string[] {
  cy.resetAllFakeServers();
  // TODO: move this to a before block
  cy.startFakeServers({
    consumer: 'user_interface',
    providers: ['jobs', 'entries', 'users'],
    cors: true,
    pactfileWriteMode: 'merge',
    dir: Cypress.env('pactDir'),
    spec: 2
  });

  cy.server();
  cy.route('**/channel/**', []).as('shareJS');

  return [
    ...defaultRequestsMock({
      publicContentTypesResponse: getAllPublicContentTypesInDefaultSpace.willReturnOne
    }),
    queryFirst100UsersInDefaultSpace.willFindSeveral(),
    getDefaultEntry.willReturnIt(),
    queryLinksToDefaultEntry.willReturnNone(),
    getFirst7SnapshotsOfDefaultEntry.willReturnNone(),
    getEditorInterfaceForDefaultContentType.willReturnOneWithoutSidebar()
  ];
}
