import { queryFirst100UsersInDefaultSpace } from '../../../interactions/users';
import {
  getAllPublicContentTypesInDefaultSpace,
  getEditorInterfaceForDefaultContentType,
} from '../../../interactions/content_types';
import { defaultRequestsMock } from '../../../util/factories';
import { defaultSpaceId, getEntries, defaultJobId } from '../../../util/requests';
import {
  getDefaultEntry,
  queryLinksToDefaultEntry,
  getFirst7SnapshotsOfDefaultEntry,
  createAnEntryInDefaultSpace,
} from '../../../interactions/entries';
import {
  queryPendingJobsForDefaultSpaceWithoutLimit,
  queryAllScheduledJobsForDefaultEntry,
} from '../../../interactions/jobs';
import {
  queryForEnvironmentUsageInDefaultSpace,
  queryForTasksInDefaultSpace,
  queryForScheduledPublishingInDefaultSpace,
  queryForBasicAppsInDefaultSpace,
  queryForContentTagsInDefaultSpace,
  queryForReleasesInDefaultSpace,
} from '../../../interactions/product_catalog_features';
import { FeatureFlag } from '../../../util/featureFlag';

const empty = require('../../../fixtures/responses/empty.json');
const severalEntriesResponse = require('../../../fixtures/responses/entries-several.json');
const nonArchivedQuery = {
  limit: '40',
  order: '-sys.updatedAt',
  skip: '0',
  'sys.archivedAt[exists]': 'false',
};
describe('Entries list page', () => {
  beforeEach(() => {
    cy.resetAllFakeServers();
    cy.disableFeatureFlags([FeatureFlag.NEW_STATUS_SWITCH]);
    // TODO: Move this to a before block
    cy.startFakeServers({
      consumer: 'user_interface',
      providers: ['entries', 'users', 'jobs', 'product_catalog_features'],
      cors: true,
      pactfileWriteMode: 'merge',
      dir: Cypress.env('pactDir'),
      spec: 2,
    });
  });

  context('no content types in the space', () => {
    beforeEach(() => {
      // TODO: Move this to interactions/entries
      cy.addInteraction({
        provider: 'entries',
        state: 'noEntries',
        uponReceiving: `a query for non-archived entries in "${defaultSpaceId}"`,
        withRequest: getEntries(defaultSpaceId, nonArchivedQuery),
        willRespondWith: {
          status: 200,
          headers: {
            'Content-Type': 'application/vnd.contentful.management.v1+json',
          },
          body: empty,
        },
      }).as('queryNonArchivedEntries');

      const interactions = [
        ...defaultRequestsMock({}),
        queryFirst100UsersInDefaultSpace.willFindSeveral(),
        queryPendingJobsForDefaultSpaceWithoutLimit.willFindSeveral(),
        queryForTasksInDefaultSpace.willFindFeatureEnabled(),
        '@queryNonArchivedEntries',
        queryForContentTagsInDefaultSpace.willFindFeatureEnabled(),
        queryForEnvironmentUsageInDefaultSpace.willFindFeatureEnabled(),
        queryForBasicAppsInDefaultSpace.willFindFeatureEnabled(),
      ];

      cy.visit(`/spaces/${defaultSpaceId}/entries`);
      cy.wait(interactions);
    });

    it('renders entries page correctly', () => {
      cy.findByTestId('no-content-type-advice').should('be.visible');
      cy.findByTestId('create-content-type-empty-state').should('be.enabled');
    });
  });

  context('no entries in the space', () => {
    beforeEach(() => {
      // TODO: Move this to interactions/entries
      cy.addInteraction({
        provider: 'entries',
        state: 'noEntries',
        uponReceiving: `a query for non-archived entries in "${defaultSpaceId}"`,
        withRequest: getEntries(defaultSpaceId, nonArchivedQuery),
        willRespondWith: {
          status: 200,
          headers: {
            'Content-Type': 'application/vnd.contentful.management.v1+json',
          },
          body: empty,
        },
      }).as('queryNonArchivedEntries');

      const interactions = [
        '@queryNonArchivedEntries',
        ...defaultRequestsMock({
          publicContentTypesResponse: getAllPublicContentTypesInDefaultSpace.willReturnOne,
        }),
        queryFirst100UsersInDefaultSpace.willFindSeveral(),
        queryPendingJobsForDefaultSpaceWithoutLimit.willFindSeveral(),
        queryForTasksInDefaultSpace.willFindFeatureEnabled(),
        queryForEnvironmentUsageInDefaultSpace.willFindFeatureEnabled(),
        queryForBasicAppsInDefaultSpace.willFindFeatureEnabled(),
        queryForContentTagsInDefaultSpace.willFindFeatureEnabled(),
      ];

      cy.visit(`/spaces/${defaultSpaceId}/entries`);

      cy.wait(interactions);
    });

    it('renders entries page correctly', () => {
      cy.findByTestId('no-entries-advice').should('be.visible');
      cy.findByTestId('create-entry-button-menu-trigger').should('be.visible');
      cy.findByTestId('create-entry-button-menu-trigger').find('button').should('be.enabled');
    });

    it('redirects to the entry page after click on create button', () => {
      const interactions = [
        createAnEntryInDefaultSpace.willSucceed(),
        getDefaultEntry.willReturnIt(),
        queryLinksToDefaultEntry.willReturnNone(),
        getFirst7SnapshotsOfDefaultEntry.willReturnNone(),
        queryForScheduledPublishingInDefaultSpace.willFindFeatureEnabled(),
        getEditorInterfaceForDefaultContentType.willReturnOneWithoutSidebar(),
        queryAllScheduledJobsForDefaultEntry.willFindOnePendingJob(),
        queryForReleasesInDefaultSpace.willFindFeatureEnabled(),
      ];
      cy.findByTestId('create-entry-button-menu-trigger').find('button').should('be.enabled');
      cy.findByTestId('create-entry-button-menu-trigger').click();

      cy.wait(interactions);

      cy.findByTestId('entity-field-controls').should('be.visible');
      cy.findByTestId('entry-editor-sidebar').should('be.visible');
    });
  });

  context('several entries in the space', () => {
    beforeEach(() => {
      // TODO: Move this to interactions/entries
      cy.addInteraction({
        provider: 'entries',
        state: 'severalEntries',
        uponReceiving: `a query for non-archived entries in "${defaultSpaceId}"`,
        withRequest: getEntries(defaultSpaceId, nonArchivedQuery),
        willRespondWith: {
          status: 200,
          headers: {
            'Content-Type': 'application/vnd.contentful.management.v1+json',
          },
          body: severalEntriesResponse,
        },
      }).as('queryNonArchivedEntries');

      const interactions = [
        '@queryNonArchivedEntries',
        ...defaultRequestsMock({}),
        queryFirst100UsersInDefaultSpace.willFindSeveral(),
        queryPendingJobsForDefaultSpaceWithoutLimit.willFindSeveral(),
        queryForTasksInDefaultSpace.willFindFeatureEnabled(),
        queryForScheduledPublishingInDefaultSpace.willFindFeatureEnabled(),
        queryForEnvironmentUsageInDefaultSpace.willFindFeatureEnabled(),
        queryForBasicAppsInDefaultSpace.willFindFeatureEnabled(),
        queryForContentTagsInDefaultSpace.willFindFeatureEnabled(),
        queryForReleasesInDefaultSpace.willFindFeatureEnabled(),
      ];

      cy.visit(`/spaces/${defaultSpaceId}/entries`);

      cy.wait(interactions);
    });

    it('renders entries page correctly', () => {
      cy.findByTestId('entry-list').should('be.visible');
      cy.findAllByTestId('entry-row').should('have.length', severalEntriesResponse.total);
    });

    it('renders the tooltip for the scheduled the entry', () => {
      cy.findByTestId('schedule-icon').trigger('mouseover');
      cy.findByTestId(defaultJobId).should('be.visible').and('have.attr', 'role', 'tooltip');
      cy.findByTestId(defaultJobId)
        .find('p[data-test-id="cf-ui-paragraph"]')
        .should('have.text', '+ 2 more');
    });
  });

  context('with several entries in the space and usage limits reached', () => {
    beforeEach(() => {
      cy.resetAllFakeServers();
      // TODO: Move this to a before block
      cy.startFakeServers({
        consumer: 'user_interface',
        providers: ['resources', 'product_catalog_features'],
        cors: true,
        pactfileWriteMode: 'merge',
        dir: Cypress.env('pactDir'),
        spec: 2,
      });

      // TODO: Move this to interactions/entries
      cy.addInteraction({
        provider: 'entries',
        state: 'severalEntries',
        uponReceiving: `a query for non-archived entries in "${defaultSpaceId}"`,
        withRequest: getEntries(defaultSpaceId, nonArchivedQuery),
        willRespondWith: {
          status: 200,
          headers: {
            'Content-Type': 'application/vnd.contentful.management.v1+json',
          },
          body: severalEntriesResponse,
        },
      }).as('queryNonArchivedEntries');

      const interactions = [
        ...defaultRequestsMock({}),
        '@queryNonArchivedEntries',
        queryFirst100UsersInDefaultSpace.willFindSeveral(),
        queryPendingJobsForDefaultSpaceWithoutLimit.willFindSeveral(),
        queryForTasksInDefaultSpace.willFindFeatureEnabled(),
        queryForScheduledPublishingInDefaultSpace.willFindFeatureEnabled(),
        queryForEnvironmentUsageInDefaultSpace.willFindFeatureEnabled(),
        queryForBasicAppsInDefaultSpace.willFindFeatureEnabled(),
        queryForContentTagsInDefaultSpace.willFindFeatureEnabled(),
        queryForReleasesInDefaultSpace.willFindFeatureEnabled(),
      ];

      cy.visit(`/spaces/${defaultSpaceId}/entries`);
      cy.wait(interactions);
    });

    it('renders a disabled "Add Entry" button', () => {
      cy.findByTestId('create-entry-button').should('be.disabled');
    });
  });
});
