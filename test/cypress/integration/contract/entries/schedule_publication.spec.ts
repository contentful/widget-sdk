import { defaultRequestsMock } from '../../../util/factories';
import { singleUser } from '../../../interactions/users';
import {
  singleContentTypeResponse,
  editorInterfaceWithoutSidebarResponse
} from '../../../interactions/content_types';
import {
  singleEntryResponse,
  noEntryLinksResponse,
  noEntrySnapshotsResponse
} from '../../../interactions/entries';
import * as state from '../../../util/interactionState';
import { defaultEntryId, defaultSpaceId } from '../../../util/requests';
import {
  singleJobForEntryResponse,
  jobIsCreatedPostResponse,
  cancelJobResponse,
  noJobsForSpecificEntryIdResponse,
  singleFailedJobForEntryResponse,
  unavailableJobsForEntryResponse
} from '../../../interactions/jobs';
import { FeatureFlag } from '../../../util/featureFlag';

describe('Schedule Publication', () => {
  before(() =>
    cy.startFakeServer({
      consumer: 'user_interface',
      provider: 'jobs',
      cors: true,
      pactfileWriteMode: 'merge',
      spec: 2
    })
  );

  beforeEach(() => {
    cy.enableFeatureFlags([FeatureFlag.SCHEDULED_PUBLICATION]);
    basicServerSetUp();
  });

  describe('scheduling a publication', () => {
    beforeEach(() => {
      noJobsForSpecificEntryIdResponse();
      cy.visit(`/spaces/${defaultSpaceId}/entries/${defaultEntryId}`);
      cy.wait(
        [
          `@${state.Token.VALID}`,
          `@${state.Enforcements.NONE}`,
          `@${state.Entries.LINKS}`,
          `@${state.Entries.SNAPSHOTS}`,
          `@${state.Jobs.NONE}`
        ],
        { timeout: 10000 }
      );
    });

    it('submits the new scheduled publication and then re-fetch the list of scheduled publications', () => {
      cy.resetAllFakeServers();

      jobIsCreatedPostResponse();

      cy.getByTestId('change-state-menu-trigger').click();
      cy.getByTestId('schedule-publication').click();

      cy.getByTestId('schedule-publication-modal')
        .should('be.visible')
        .find('[data-test-id="schedule-publication"]')
        .first()
        .click();

      cy.wait([`@${state.Jobs.CREATED}`]);
      cy.getByTestId('scheduled-item').should('have.length', 1);
      cy.getByTestId('change-state-published').should('be.disabled');
    });
  });

  describe('cancelling a publication', () => {
    beforeEach(() => {
      singleJobForEntryResponse();
      cancelJobResponse();

      cy.visit(`/spaces/${defaultSpaceId}/entries/${defaultEntryId}`);
      cy.wait(
        [
          `@${state.Token.VALID}`,
          `@${state.Enforcements.NONE}`,
          `@${state.Entries.LINKS}`,
          `@${state.Jobs.SINGLE}`
        ],
        { timeout: 10000 }
      );
    });

    it('cancels publication after clicking on the grey button', () => {
      cy.resetAllFakeServers();

      cancelJobResponse();

      cy.getByTestId('cancel-job-ddl').click();
      cy.getByTestId('cancel-job').click();
      cy.getByTestId('job-cancellation-modal')
        .should('be.visible')
        .find('[data-test-id="confirm-job-cancellation"]')
        .first()
        .click();
      cy.wait([`@${state.Jobs.CANCEL}`]);
      cy.getByTestId('change-state-menu-trigger').should('be.visible');
      cy.getByTestId('change-state-published').should('be.enabled');
    });
  });
  describe('error states', () => {
    it('renders error note is the last job is failed', () => {
      singleFailedJobForEntryResponse();

      cy.visit(`/spaces/${defaultSpaceId}/entries/${defaultEntryId}`);
      cy.wait(
        [
          `@${state.Token.VALID}`,
          `@${state.Enforcements.NONE}`,
          `@${state.Entries.LINKS}`,
          `@${state.Jobs.FAILED}`
        ],
        { timeout: 10000 }
      );

      cy.getByTestId('failed-job-note')
        .should('be.visible')
        .should('contain', 'failed');
      cy.getByTestId('change-state-published').should('be.enabled');
    });

    it('renders error note if jobs endpoint returns 500', () => {
      unavailableJobsForEntryResponse();

      cy.visit(`/spaces/${defaultSpaceId}/entries/${defaultEntryId}`);
      cy.wait(
        [
          `@${state.Token.VALID}`,
          `@${state.Enforcements.NONE}`,
          `@${state.Entries.LINKS}`,
          `@${state.Jobs.ERROR}`
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

  defaultRequestsMock({
    publicContentTypesResponse: singleContentTypeResponse
  });
  singleUser();
  singleEntryResponse();
  noEntryLinksResponse();
  noEntrySnapshotsResponse();
  editorInterfaceWithoutSidebarResponse();

  cy.route('**/channel/**', []).as('shareJS');
}
