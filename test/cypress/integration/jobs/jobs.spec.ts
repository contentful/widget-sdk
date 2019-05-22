import { defaultRequestsMock } from '../../util/factories';
import * as state from '../../util/interactionState';
import { defaultSpaceId } from '../../util/requests';
import { singleContentTypeResponse } from '../../interactions/content_types';
import {
  noJobsResponse,
  severalJobsResponseBody,
  severalJobsResponse,
  jobsErrorResponse
} from '../../interactions/jobs';
import { singleEntryWithQuery } from '../../interactions/entries';
import { singleSpecificSpaceUserResponse } from '../../interactions/users';

const featureFlag = 'feature-pul-04-2019-scheduled-publication-enabled';

describe('Jobs page', () => {
  beforeEach(() => {
    cy.resetAllFakeServers();

    cy.startFakeServer({
      consumer: 'user_interface',
      provider: 'jobs',
      cors: true,
      pactfileWriteMode: 'merge',
      spec: 3
    });
  });
  context('no jobs in the space', () => {
    describe('opening the page', () => {
      beforeEach(() => {
        defaultRequestsMock();
        noJobsResponse();

        cy.setAuthTokenToLocalStorage();
        window.localStorage.setItem('ui_enable_flags', JSON.stringify([featureFlag]));

        cy.visit(`/spaces/${defaultSpaceId}/jobs`);
        cy.wait([`@${state.Token.VALID}`]);
        cy.wait([`@${state.Jobs.NONE}`], { timeout: 10000 });
      });
      it('renders illustration and heading for empty state', () => {
        cy.getByTestId('cf-ui-tab-panel')
          .should('be.visible')
          .find('svg')
          .should('be.visible')
          .getByTestId('cf-ui-heading')
          .should('contain', 'no Jobs scheduled');
      });
    });
  });

  context('several jobs in the space', () => {
    describe('opening the page', () => {
      beforeEach(() => {
        defaultRequestsMock({
          publicContentTypesResponse: singleContentTypeResponse
        });
        severalJobsResponse();
        singleEntryWithQuery();
        singleSpecificSpaceUserResponse();

        cy.setAuthTokenToLocalStorage();
        window.localStorage.setItem('ui_enable_flags', JSON.stringify([featureFlag]));

        cy.visit(`/spaces/${defaultSpaceId}/jobs`);
        cy.wait([`@${state.Token.VALID}`]);
        cy.wait([`@${state.Jobs.SEVERAL}`, `@${state.Entries.QUERY}`, `@${state.Users.QUERY}`], {
          timeout: 10000
        });
      });
      it('renders list of jobs', () => {
        cy.getByTestId('jobs-table')
          .should('be.visible')
          .getAllByTestId('scheduled-job')
          .should('have.length', severalJobsResponseBody.total);
      });
    });
  });

  context('error state', () => {
    describe('opening the page', () => {
      beforeEach(() => {
        defaultRequestsMock();
        jobsErrorResponse();

        cy.setAuthTokenToLocalStorage();
        window.localStorage.setItem('ui_enable_flags', JSON.stringify([featureFlag]));

        cy.visit(`/spaces/${defaultSpaceId}/jobs`);
        cy.wait([`@${state.Token.VALID}`]);
        cy.wait([`@${state.Jobs.ERROR}`], { timeout: 10000 });
      });
      it('renders illustration and heading for error state', () => {
        cy.getByTestId('cf-ui-tab-panel')
          .should('be.visible')
          .find('svg')
          .should('be.visible')
          .getByTestId('cf-ui-jobs-state-error')
          .should('contain', 'Something went wrong');
      });
    });
  });
});
