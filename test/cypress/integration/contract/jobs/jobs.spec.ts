import { defaultRequestsMock } from '../../../util/factories';
import * as state from '../../../util/interactionState';
import { defaultSpaceId } from '../../../util/requests';
import { getAllPublicContentTypesInDefaultSpace } from '../../../interactions/content_types';
import {
  queryAllJobsForDefaultSpace,
  severalJobsResponseBody
} from '../../../interactions/jobs';
import { queryForDefaultEntryInsideEnvironment } from '../../../interactions/entries';
import { singleSpecificSpaceUserResponse } from '../../../interactions/users';
import { FeatureFlag } from '../../../util/featureFlag';

describe('Jobs page', () => {
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
    cy.resetAllFakeServers();
    cy.enableFeatureFlags([FeatureFlag.SCHEDULED_PUBLICATION]);
  });

  context('no jobs in the space', () => {
    beforeEach(() => {
      defaultRequestsMock();
      queryAllJobsForDefaultSpace.willFindNone();

      cy.visit(`/spaces/${defaultSpaceId}/jobs`);
      cy.wait([`@${state.Token.VALID}`]);
      cy.wait([`@${state.Jobs.NO_JOBS_FOR_DEFAULT_SPACE}`], { timeout: 10000 });
    });
    it('renders illustration and heading for empty state', () => {
      cy.getByTestId('cf-ui-tab-panel')
        .should('be.visible')
        .find('svg')
        .should('be.visible')
        .getByTestId('cf-ui-heading')
        .should('contain', 'Nothing is scheduled');
    });
  });

  context('several jobs in the space', () => {
    beforeEach(() => {
      cy.resetAllFakeServers();
      cy.startFakeServers({
        consumer: 'user_interface',
        providers: ['entries', 'users'],
        cors: true,
        pactfileWriteMode: 'merge',
        spec: 2
      });
      defaultRequestsMock({
        publicContentTypesResponse: getAllPublicContentTypesInDefaultSpace.willReturnOne
      });
      queryAllJobsForDefaultSpace.willFindSeveral();
      queryForDefaultEntryInsideEnvironment.willFindIt();
      singleSpecificSpaceUserResponse();

      cy.visit(`/spaces/${defaultSpaceId}/jobs`);
      cy.wait([`@${state.Token.VALID}`]);
      cy.wait([`@${state.Jobs.SEVERAL_JOBS_FOR_DEFAULT_SPACE}`, `@${state.Entries.SEVERAL}`, `@${state.Users.SINGLE}`], {
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

  context('error state', () => {
    beforeEach(() => {
      defaultRequestsMock();
      queryAllJobsForDefaultSpace.willFailWithAnInternalServerError();

      cy.visit(`/spaces/${defaultSpaceId}/jobs`);
      cy.wait([`@${state.Token.VALID}`]);
      cy.wait([`@${state.Jobs.INTERNAL_SERVER_ERROR}`], { timeout: 10000 });
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
