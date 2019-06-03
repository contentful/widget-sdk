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
  noJobsForSpecificEntryIdResponse
} from '../../../interactions/jobs';

const featureFlag = 'feature-pul-04-2019-scheduled-publication-enabled';

describe('Schedule Publication', () => {
  before(() =>
    cy.startFakeServer({
      consumer: 'user_interface',
      provider: 'jobs',
      cors: true,
      pactfileWriteMode: 'merge'
    })
  );

  function basicServerSetUpWithnoJobs() {
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

    noJobsForSpecificEntryIdResponse();

    cy.route('**/channel/**', []).as('shareJS');
  }

  before(() => {
    cy.setAuthTokenToLocalStorage();
    window.localStorage.setItem('ui_enable_flags', JSON.stringify([featureFlag]));

    basicServerSetUpWithnoJobs();

    cy.visit(`/spaces/${defaultSpaceId}/entries/${defaultEntryId}`);

    cy.wait([`@${state.Token.VALID}`, `@${state.Entries.NONE}`]);
    cy.wait([`@${state.Jobs.NONE}`], { timeout: 10000 });
  });

  describe('opening the page', () => {
    it('renders schedule publication button', () => {
      cy.getByTestId('schedule-publication').should('be.visible');
    });
  });

  describe('scheduling a publication', () => {
    before(() => {
      cy.resetAllFakeServers();

      jobIsCreatedPostResponse();
      singleJobForEntryResponse();

      cy.getByTestId('schedule-publication').click();
      cy.getByTestId('schedule-publication-modal')
        .should('be.visible')
        .getByTestId('cf-ui-button')
        .first()
        .click();

      cy.wait([`@${state.Jobs.CREATED}`, `@${state.Jobs.SINGLE}`]);
    });

    it('submits the new scheduled publication and then re-fetch the list of scheduled publications', () => {
      cy.getByTestId('scheduled-item').should('have.length', 1);
    });
  });
});
