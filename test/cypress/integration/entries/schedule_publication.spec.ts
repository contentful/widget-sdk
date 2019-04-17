import { defaultRequestsMock } from '../../mocks/factories';
import { singleUser } from '../../mocks/users';
import { singleContentTypeResponse, editorInterfaceResponse } from '../../mocks/content_types';
import {
  entryId,
  singleEntryResponse,
  noEntryLinksResponse,
  noEntrySnapshotsResponse
} from '../../mocks/entries';
import { microbackendStreamToken } from '../../mocks/microbackend';
import * as state from '../../mocks/interactionState';

const spaceId = Cypress.env('spaceId');
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

    cy.visit(`/spaces/${spaceId}/entries/${entryId}`);
    cy.addInteraction({
      state: 'noSchedules',
      uponReceiving: 'a request for entry schedules',
      withRequest: {
        method: 'GET',
        path: `/spaces/${spaceId}/environments/master/entries/${entryId}/schedules`,
        headers: {
          Accept: 'application/json, text/plain, */*'
        }
      },
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
        path: `/spaces/${spaceId}/environments/master/entries/${entryId}/schedules`,
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
      withRequest: {
        method: 'GET',
        path: `/spaces/${spaceId}/environments/master/entries/${entryId}/schedules`,
        headers: {
          Accept: 'application/json, text/plain, */*'
        }
      },
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
