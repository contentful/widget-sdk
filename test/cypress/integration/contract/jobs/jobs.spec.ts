import { defaultRequestsMock } from '../../../util/factories';
import { defaultSpaceId } from '../../../util/requests';
import { getAllPublicContentTypesInDefaultSpace } from '../../../interactions/content_types';
import { queryAllJobsForDefaultSpace } from '../../../interactions/jobs';
import { severalJobsResponse } from '../../../fixtures/responses/jobs-several';
import { queryForDefaultEntryWithoutEnvironment } from '../../../interactions/entries';
import { queryForDefaultUserDetails } from '../../../interactions/users';
import { FeatureFlag } from '../../../util/featureFlag';

describe('Jobs page', () => {
  before(() =>
    cy.startFakeServer({
      consumer: 'user_interface',
      provider: 'jobs',
      cors: true,
      pactfileWriteMode: 'merge',
      dir: Cypress.env('pactDir'),
      spec: 2
    })
  );

  beforeEach(() => {
    cy.resetAllFakeServers();
    cy.enableFeatureFlags([FeatureFlag.SCHEDULED_PUBLICATION]);
  });

  context('no jobs in the space', () => {
    beforeEach(() => {
      const interactions = defaultRequestsMock();
      const slowInteraction = queryAllJobsForDefaultSpace.willFindNone();

      cy.visit(`/spaces/${defaultSpaceId}/jobs`);

      cy.wait(interactions);
      cy.wait(slowInteraction, { timeout: 10000 });
    });
    it('renders illustration and heading for empty state', () => {
      cy.getByTestId('cf-ui-tab-panel')
        .should('be.visible')
        .find('svg')
        .should('be.visible')
        .getByTestId('jobs-state-message-heading')
        .should('contain', 'Nothing is scheduled');
    });
  });

  context('several jobs in the space', () => {
    beforeEach(() => {
      cy.resetAllFakeServers();
      // TODO: move this to a before block
      cy.startFakeServers({
        consumer: 'user_interface',
        providers: ['entries', 'users'],
        cors: true,
        pactfileWriteMode: 'merge',
        dir: Cypress.env('pactDir'),
        spec: 2
      });
      const interactions = defaultRequestsMock({
        publicContentTypesResponse: getAllPublicContentTypesInDefaultSpace.willReturnOne
      });
      const slowInteractions = [
        queryAllJobsForDefaultSpace.willFindSeveral(),
        queryForDefaultEntryWithoutEnvironment.willFindIt(),
        queryForDefaultUserDetails.willFindTheUserDetails()
      ];

      cy.visit(`/spaces/${defaultSpaceId}/jobs`);
      cy.wait(interactions);
      cy.wait(slowInteractions, {
        timeout: 10000
      });
    });
    it('renders list of jobs', () => {
      cy.getByTestId('scheduled-jobs-date-group')
        .should('be.visible')
        .getAllByTestId('cf-ui-entity-list-item')
        .should('have.length', severalJobsResponse.items.length);
    });
  });

  context('error state', () => {
    beforeEach(() => {
      const interactions = defaultRequestsMock();
      const slowInteraction = queryAllJobsForDefaultSpace.willFailWithAnInternalServerError();

      cy.visit(`/spaces/${defaultSpaceId}/jobs`);
      cy.wait(interactions);
      cy.wait(slowInteraction, { timeout: 10000 });
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
