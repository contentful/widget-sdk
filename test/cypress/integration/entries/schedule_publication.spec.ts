import { defaultRequestsMock } from '../../util/factories';
import { singleUser } from '../../interactions/users';
import {
  singleContentTypeResponse,
  editorInterfaceResponse
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
  before(() => {
    cy.setAuthTokenToLocalStorage();
    defaultRequestsMock({
      publicContentTypesResponse: singleContentTypeResponse
    });
    singleUser();
    singleEntryResponse();
    noEntryLinksResponse();
    noEntrySnapshotsResponse();
    editorInterfaceResponse();
    microbackendStreamToken();

    cy.route('**/_microbackends/backends/**').as('microbackend');
    cy.route('POST', '**/_microbackends/backends/**').as('microbackendPOST');
    cy.route('**/channel/**', []).as('shareJS');

    window.localStorage.setItem('ui_enable_flags', JSON.stringify([featureFlag]));

    cy.visit(`/spaces/${defaultSpaceId}/entries/${defaultEntryId}`);
    cy.addInteraction({
      state: 'noSchedules',
      uponReceiving: 'a request for entry schedules',
      withRequest: getEntrySchedules(),
      willRespondWith: {
        status: 200,
        body: empty
      }
    }).as('entrySchedules');
    cy.wait([`@${state.Token.VALID}`, `@entrySchedules`]);
  });
  it('renders schedule publication button', () => {
    cy.getByTestId('schedule-publication').should('be.visible');
  });
  it('can schedule publication', () => {
    cy.addInteraction({
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
    }).as('schedulePOST');
    cy.addInteraction({
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
    }).as('oneSchedule');

    cy.getByTestId('schedule-publication').click();
    cy.getByTestId('schedule-publication-modal')
      .should('be.visible')
      .getByTestId('cf-ui-button')
      .first()
      .click();
    cy.wait('@schedulePOST');
    cy.wait('@oneSchedule');
    cy.getByTestId('scheduled-item').should('have.length', 1);
  });
});
