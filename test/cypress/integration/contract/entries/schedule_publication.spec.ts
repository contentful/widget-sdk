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
import { microbackendStreamToken } from '../../../interactions/microbackend';
import * as state from '../../../util/interactionState';
import { defaultEntryId, defaultSpaceId } from '../../../util/requests';
import {
  singleJobForEntryResponse,
  jobIsCreatedPostResponse,
  cancelJobResponse,
  noJobsForSpecificEntryIdResponse
} from '../../../interactions/jobs';
import { FeatureFlag } from '../../../util/featureFlag';

describe('Schedule Publication', () => {
  before(() =>
    cy.startFakeServer({
      consumer: 'user_interface',
      provider: 'jobs',
      cors: true,
      pactfileWriteMode: 'merge'
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
      cy.wait([`@${state.Jobs.NONE}`]);
    });

    it('submits the new scheduled publication and then re-fetch the list of scheduled publications', () => {
      cy.resetAllFakeServers();

      jobIsCreatedPostResponse();
      singleJobForEntryResponse();
      cy.getByTestId('schedule-publication').click();
      cy.getByTestId('schedule-publication-modal')
        .should('be.visible')
        .find('[data-test-id="schedule-publication"]')
        .first()
        .click();

      cy.wait([`@${state.Jobs.CREATED}`, `@${state.Jobs.SINGLE}`]);
      cy.getByTestId('scheduled-item').should('have.length', 1);
    });
  });

  describe('cancelling a publication', () => {
    beforeEach(() => {
      singleJobForEntryResponse();
      cancelJobResponse();

      cy.visit(`/spaces/${defaultSpaceId}/entries/${defaultEntryId}`);
      cy.wait([`@${state.Jobs.SINGLE}`]);
    });

    it('cancels publication after clicking on the grey button', () => {
      cy.resetAllFakeServers();

      cancelJobResponse();
      noJobsForSpecificEntryIdResponse();
      cy.getByTestId('cancel-job-ddl').click();
      cy.getByTestId('cancel-job').click();
      cy.getByTestId('job-cancellation-modal')
        .should('be.visible')
        .find('[data-test-id="confirm-job-cancellation"]')
        .first()
        .click();
      cy.wait([`@${state.Jobs.CANCEL}`, `@${state.Jobs.NONE}`]);
      cy.getByTestId('schedule-publication').should('be.visible');
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
  microbackendStreamToken();

  cy.route('**/channel/**', []).as('shareJS');
}
