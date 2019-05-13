import { defaultRequestsMock } from '../../util/factories';
import { singleUser } from '../../interactions/users';
import {
  singleContentTypeResponse,
  editorInterfaceWithoutSidebarResponse
} from '../../interactions/content_types';
import {
  singleEntryResponse,
  noEntryLinksResponse,
  noEntrySnapshotsResponse
} from '../../interactions/entries';
import { microbackendStreamToken } from '../../interactions/microbackend';
import * as state from '../../util/interactionState';
import { defaultEntryId, defaultSpaceId, getEntrySchedules } from '../../util/requests';

const empty = require('../../fixtures/empty.json');
const featureFlag = 'feature-pul-04-2019-scheduled-publication-enabled';

describe('Schedule Publication', () => {
  before(() =>
    cy.startFakeServer({
      consumer: 'user_interface',
      provider: 'scheduled-actions',
      cors: true,
      pactfileWriteMode: 'merge',
      spec: 3
    })
  );

  function basicServerSetUpWithNoSchedules() {
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

    cy.addInteraction({
      provider: 'scheduled-actions',
      state: 'noSchedules',
      uponReceiving: 'a request for entry schedules',
      withRequest: getEntrySchedules(),
      willRespondWith: {
        status: 200,
        body: empty
      }
    }).as('scheduled-actions/none');

    cy.route('**/channel/**', []).as('shareJS');
  }

  before(() => {
    cy.setAuthTokenToLocalStorage();
    window.localStorage.setItem('ui_enable_flags', JSON.stringify([featureFlag]));

    basicServerSetUpWithNoSchedules();

    cy.visit(`/spaces/${defaultSpaceId}/entries/${defaultEntryId}`);

    cy.wait([
      `@${state.Token.VALID}`,
      '@scheduled-actions/none',
      `@${state.PreviewEnvironments.NONE}`
    ]);
  });

  describe('opening the page', () => {
    it('renders schedule publication button', () => {
      cy.getByTestId('schedule-publication').should('be.visible');
    });
  });

  describe('scheduling a publication', () => {
    before(() => {
      cy.resetAllFakeServers();

      cy.addInteraction({
        provider: 'scheduled-actions',
        state: 'schedulePublicationPost',
        uponReceiving: 'a post request for scheduling publication',
        withRequest: {
          method: 'POST',
          path: `/spaces/${defaultSpaceId}/environments/master/entries/${defaultEntryId}/schedules`,
          headers: {
            Accept: 'application/json, text/plain, */*',
            'x-contentful-enable-alpha-feature': 'scheduled-actions'
          }
        },
        willRespondWith: {
          status: 200
        }
      }).as('scheduled-actions/create');

      cy.addInteraction({
        provider: 'scheduled-actions',
        state: 'oneSchedule',
        uponReceiving: 'a request for entry schedules',
        withRequest: getEntrySchedules(),
        willRespondWith: {
          status: 200,
          body: {
            sys: {
              type: 'Array'
            },
            total: 1,
            skip: 0,
            limit: 1000,
            items: [
              {
                sys: {
                  id: 'scheduleId',
                  status: 'pending'
                },
                actionType: 'publish',
                scheduledAt: '2019-08-08T06:10:52.066Z'
              }
            ]
          }
        }
      }).as('scheduled-actions/one');

      cy.getByTestId('schedule-publication').click();
      cy.getByTestId('schedule-publication-modal')
        .should('be.visible')
        .getByTestId('cf-ui-button')
        .first()
        .click();

      cy.wait(['@scheduled-actions/create', '@scheduled-actions/one']);
    });

    it('submits the new scheduled publication and then re-fetch the list of scheduled publications', () => {
      cy.getByTestId('scheduled-item').should('have.length', 1);
    });
  });
});
