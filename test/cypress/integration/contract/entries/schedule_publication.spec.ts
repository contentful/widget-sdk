import { defaultRequestsMock } from '../../../util/factories';
import { singleUser } from '../../../interactions/users';
import {
  getAllPublicContentTypesInDefaultSpace,
  getEditorInterfaceForDefaultContentType
} from '../../../interactions/content_types';
import {
  getDefaultEntry,
  queryLinksToDefaultEntry,
  getFirst7SnapshotsOfDefaultEntry
} from '../../../interactions/entries';
import * as state from '../../../util/interactionState';
import { defaultEntryId, defaultSpaceId } from '../../../util/requests';
import {
  createScheduledPublicationForDefaultSpace,
  cancelDefaultJobInDefaultSpace,
  queryAllScheduledJobsForDefaultEntry
} from '../../../interactions/jobs';
import { FeatureFlag } from '../../../util/featureFlag';

describe('Schedule Publication', () => {
  beforeEach(() => {
    cy.enableFeatureFlags([FeatureFlag.SCHEDULED_PUBLICATION]);
    basicServerSetUp();
  });

  describe('scheduling a publication', () => {
    beforeEach(() => {
      queryAllScheduledJobsForDefaultEntry.willFindNone();
      cy.visit(`/spaces/${defaultSpaceId}/entries/${defaultEntryId}`);
      cy.wait(
        [
          `@${state.Token.VALID}`,
          `@${state.Enforcements.NONE}`,
          `@${state.Entries.NO_LINKS_TO_DEFAULT_ENTRY}`,
          `@${state.Entries.NO_SNAPSHOTS_FOR_DEFAULT_ENTRY}`,
          `@${state.Jobs.NO_JOBS_SCHEDULED_FOR_DEFAULT_ENTRY}`
        ],
        { timeout: 10000 }
      );
    });

    it('submits the new scheduled publication and then re-fetch the list of scheduled publications', () => {
      cy.resetAllFakeServers();

      createScheduledPublicationForDefaultSpace
        .willSucceed()
        .as('job-created-successfully');

      cy.getByTestId('change-state-menu-trigger').click();
      cy.getByTestId('schedule-publication').click();

      cy.getByTestId('schedule-publication-modal')
        .should('be.visible')
        .find('[data-test-id="schedule-publication"]')
        .first()
        .click();

      cy.wait(['@job-created-successfully']);
      cy.getByTestId('scheduled-item').should('have.length', 1);
      cy.getByTestId('change-state-published').should('be.disabled');
    });
  });

  describe('cancelling a publication', () => {
    beforeEach(() => {
      queryAllScheduledJobsForDefaultEntry.willFindOnePendingJob();
      // TODO: It seems the wrong place for this set up
      cancelDefaultJobInDefaultSpace.willSucceed();

      cy.visit(`/spaces/${defaultSpaceId}/entries/${defaultEntryId}`);
      cy.wait(
        [
          `@${state.Token.VALID}`,
          `@${state.Enforcements.NONE}`,
          `@${state.Entries.NO_LINKS_TO_DEFAULT_ENTRY}`,
          `@${state.Jobs.ONE_PENDING_JOB_SCHEDULED_FOR_DEFAULT_ENTRY}`
        ],
        { timeout: 10000 }
      );
    });

    it('cancels publication after clicking on the grey button', () => {
      cy.resetAllFakeServers();

      cancelDefaultJobInDefaultSpace.willSucceed().as('job-cancelled');

      cy.getByTestId('cancel-job-ddl').click();
      cy.getByTestId('cancel-job').click();
      cy.getByTestId('job-cancellation-modal')
        .should('be.visible')
        .find('[data-test-id="confirm-job-cancellation"]')
        .first()
        .click();
      cy.wait(['@job-cancelled']);
      cy.getByTestId('change-state-menu-trigger').should('be.visible');
      cy.getByTestId('change-state-published').should('be.enabled');
    });
  });
  describe('error states', () => {
    it('renders error note is the last job is failed', () => {
      queryAllScheduledJobsForDefaultEntry.willFindOneFailedJob();

      cy.visit(`/spaces/${defaultSpaceId}/entries/${defaultEntryId}`);
      cy.wait(
        [
          `@${state.Token.VALID}`,
          `@${state.Enforcements.NONE}`,
          `@${state.Entries.NO_LINKS_TO_DEFAULT_ENTRY}`,
          `@${state.Jobs.JOB_EXECUTION_FAILED}`
        ],
        { timeout: 10000 }
      );

      cy.getByTestId('failed-job-note')
        .should('be.visible')
        .should('contain', 'failed');
      cy.getByTestId('change-state-published').should('be.enabled');
    });

    it('renders error note if jobs endpoint returns 500', () => {
      queryAllScheduledJobsForDefaultEntry.willFailWithAnInternalServerError();

      cy.visit(`/spaces/${defaultSpaceId}/entries/${defaultEntryId}`);
      cy.wait(
        [
          `@${state.Token.VALID}`,
          `@${state.Enforcements.NONE}`,
          `@${state.Entries.NO_LINKS_TO_DEFAULT_ENTRY}`,
          `@${state.Jobs.INTERNAL_SERVER_ERROR}`
        ],
        { timeout: 10000 }
      );

      cy.getByTestId('cf-ui-note')
        .should('be.visible')
        .should('contain', 'refresh');
      cy.getByTestId('change-state-published').should('be.enabled');
    });
  });
});

function basicServerSetUp() {
  cy.resetAllFakeServers();
  cy.startFakeServers({
    consumer: 'user_interface',
    providers: ['jobs', 'entries', 'users'],
    cors: true,
    pactfileWriteMode: 'merge',
    spec: 2
  });

  defaultRequestsMock({
    publicContentTypesResponse: getAllPublicContentTypesInDefaultSpace.willReturnOne
  });
  singleUser();
  getDefaultEntry.willReturnIt();
  queryLinksToDefaultEntry.willReturnNone();
  getFirst7SnapshotsOfDefaultEntry.willReturnNone();
  getEditorInterfaceForDefaultContentType.willReturnOneWithoutSidebar();

  cy.route('**/channel/**', []).as('shareJS');
}
