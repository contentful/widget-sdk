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
  States as EntryStates,
} from '../../../interactions/entries';
import {
  queryPendingJobsForDefaultSpaceWithMaxLimit,
  queryAllScheduledJobsForDefaultEntry,
} from '../../../interactions/jobs';
import * as ProductCatalog from '../../../interactions/product_catalog_features';
import { severalEntriesResponse } from '../../../fixtures/responses/entries-several';

const empty = require('../../../fixtures/responses/empty.json');
const nonArchivedQuery = {
  limit: '40',
  order: '-sys.updatedAt',
  skip: '0',
  'sys.archivedAt[exists]': 'false',
};

// List of key => pointer to product catalog expectation function (NOT executed)
const defaultProductCatalogResponses = {
  scheduledPublishing:
    ProductCatalog.queryForScheduledPublishingInDefaultSpace.willFindFeatureEnabled,
  tasks: ProductCatalog.queryForTasksInDefaultSpace.willFindFeatureEnabled,
  contentTags: ProductCatalog.queryForContentTagsInDefaultSpace.willFindFeatureEnabled,
  environmentUsage: ProductCatalog.queryForEnvironmentUsageInDefaultSpace.willFindFeatureEnabled,
  basicApps: ProductCatalog.queryForBasicAppsInDefaultSpace.willFindFeatureEnabled,
} as const;

/**
 * sets up expected calls to the product catalog with the ability to override
 * @example
 * const interactions = [
 *   ...withProductCatalogResponses({
 *     tasks: ProductCatalog.queryForTasksInDefaultSpace.willFindFeatureDisabled
 *   })
 * ]
 *
 * will execute all of the usual response expectations with tasks being disabled
 */
function withProductCatalogResponses(
  overrides: Partial<typeof defaultProductCatalogResponses> = {}
) {
  const merged = {
    ...defaultProductCatalogResponses,
    ...overrides,
  };

  // go init all of the Pact expectations
  return Object.values(merged).map((fn) => fn());
}

describe('Entries list page', () => {
  beforeEach(() => {
    cy.resetAllFakeServers();
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
        state: EntryStates.NONE,
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
        ...withProductCatalogResponses(),
        queryPendingJobsForDefaultSpaceWithMaxLimit.willFindSeveral(),
        '@queryNonArchivedEntries',
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
        state: EntryStates.NONE,
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
        ...withProductCatalogResponses(),
        queryPendingJobsForDefaultSpaceWithMaxLimit.willFindSeveral(),
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
        ProductCatalog.queryForReferencesTreeInDefaultSpace.willFindFeatureEnabled(),
        createAnEntryInDefaultSpace.willSucceed(),
        getDefaultEntry.willReturnIt(),
        queryLinksToDefaultEntry.willReturnNone(),
        getFirst7SnapshotsOfDefaultEntry.willReturnNone(),
        getEditorInterfaceForDefaultContentType.willReturnOneWithoutSidebar(),
        queryAllScheduledJobsForDefaultEntry.willFindOnePendingJob(),
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
        state: EntryStates.SEVERAL,
        uponReceiving: `a query for non-archived entries in "${defaultSpaceId}"`,
        withRequest: getEntries(defaultSpaceId, nonArchivedQuery),
        willRespondWith: {
          status: 200,
          headers: {
            'Content-Type': 'application/vnd.contentful.management.v1+json',
          },
          body: severalEntriesResponse(),
        },
      }).as('queryNonArchivedEntries');

      const interactions = [
        '@queryNonArchivedEntries',
        ...defaultRequestsMock({}),
        ...withProductCatalogResponses(),
        queryFirst100UsersInDefaultSpace.willFindSeveral(),
        queryPendingJobsForDefaultSpaceWithMaxLimit.willFindSeveral(),
      ];

      cy.visit(`/spaces/${defaultSpaceId}/entries`);

      cy.wait(interactions);
    });

    it('renders entries page correctly', () => {
      cy.findByTestId('entry-list').should('be.visible');
      cy.findAllByTestId('entry-row').should('have.length', severalEntriesResponse().total);
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
        state: EntryStates.SEVERAL,
        uponReceiving: `a query for non-archived entries in "${defaultSpaceId}"`,
        withRequest: getEntries(defaultSpaceId, nonArchivedQuery),
        willRespondWith: {
          status: 200,
          headers: {
            'Content-Type': 'application/vnd.contentful.management.v1+json',
          },
          body: severalEntriesResponse(),
        },
      }).as('queryNonArchivedEntries');

      const interactions = [
        ...defaultRequestsMock({}),
        ...withProductCatalogResponses(),
        '@queryNonArchivedEntries',
        queryFirst100UsersInDefaultSpace.willFindSeveral(),
        queryPendingJobsForDefaultSpaceWithMaxLimit.willFindSeveral(),
      ];

      cy.visit(`/spaces/${defaultSpaceId}/entries`);
      cy.wait(interactions);
    });

    it('renders a disabled "Add Entry" button', () => {
      cy.findByTestId('create-entry-button').should('be.disabled');
    });
  });
});
