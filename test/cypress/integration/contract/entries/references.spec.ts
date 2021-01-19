import { defaultRequestsMock } from '../../../util/factories';
import { queryFirst100UsersInDefaultSpace } from '../../../interactions/users';
import {
  getAllPublicContentTypesInDefaultSpace,
  getEditorInterfaceForDefaultContentType,
} from '../../../interactions/content_types';
import {
  getDefaultEntry,
  validateEntryReferencesResponse,
  publishEntryReferencesResponse,
  queryLinksToDefaultEntry,
  getFirst7SnapshotsOfDefaultEntry,
  getEntryReferences,
  queryForDefaultEntries,
} from '../../../interactions/entries';
import { defaultEntryId, defaultSpaceId } from '../../../util/requests';
import { FeatureFlag } from '../../../util/featureFlag';
import {
  queryForTasksInDefaultSpace,
  queryForBasicAppsInDefaultSpace,
  queryForScheduledPublishingOnEntryPage,
  queryForContentTagsInDefaultSpace,
  queryForReleasesInDefaultSpace,
  getLaunchAppFeatureInDefaultSpace,
} from '../../../interactions/product_catalog_features';
import { getBulkAction, publishBulkAction } from '../../../interactions/bulk_actions';

function setupTestServers(): void {
  cy.resetAllFakeServers();
  cy.startFakeServers({
    consumer: 'user_interface',
    providers: ['jobs', 'entries', 'users', 'product_catalog_features', 'releases', 'bulk-actions'],
    cors: true,
    dir: Cypress.env('pactDir'),
    spec: 2,
  });

  cy.verifyAndResetAllFakeServers;
  cy.server();
  cy.route('**/channel/**', []).as('shareJS');
}

describe('Entry references', () => {
  const setupInteractions = () => {
    defaultRequestsMock({
      publicContentTypesResponse: getAllPublicContentTypesInDefaultSpace.willReturnOne,
    });
    queryFirst100UsersInDefaultSpace.willFindSeveral();
    getDefaultEntry.willReturnIt();
    queryLinksToDefaultEntry.willReturnNone();
    getFirst7SnapshotsOfDefaultEntry.willReturnNone();
    getEditorInterfaceForDefaultContentType.willReturnOneWithoutSidebar();
    queryForTasksInDefaultSpace.willFindFeatureEnabled();
    queryForBasicAppsInDefaultSpace.willFindFeatureEnabled();
    queryForScheduledPublishingOnEntryPage.willFindFeatureEnabled();
    queryForContentTagsInDefaultSpace.willFindFeatureEnabled();
    queryForReleasesInDefaultSpace.willFindFeatureEnabled();
    getLaunchAppFeatureInDefaultSpace.willFindFeatureEnabled();
  };

  beforeEach(() => {
    setupTestServers();
    setupInteractions();
    cy.enableFeatureFlags([FeatureFlag.RELEASES]);
  });

  describe('Validation', () => {
    beforeEach(() => {
      cy.visit(`/spaces/${defaultSpaceId}/entries/${defaultEntryId}`);
    });

    it('validates release without errors', () => {
      getEntryReferences.willReturnSeveral();
      validateEntryReferencesResponse.willReturnNoErrors();

      cy.findByTestId('test-id-editor-builtin-reference-tree').click();
      cy.findByTestId('selectAllReferences').check();
      cy.findByTestId('validateReferencesBtn').click();

      cy.findByTestId('cf-ui-notification')
        .click({ timeout: 5000 }) // official cypress workaround for animation
        .should('be.visible')
        .should('contain', 'All references passed validation');
    });

    it('validates release with errors', () => {
      getEntryReferences.willReturnSeveral();
      validateEntryReferencesResponse.willReturnErrors();

      cy.findByTestId('test-id-editor-builtin-reference-tree').click();
      cy.findByTestId('selectAllReferences').check();
      cy.findByTestId('validateReferencesBtn').click();

      cy.findByTestId('cf-ui-notification')
        .click({ timeout: 5000 })
        .should('be.visible')
        .should('contain', 'Some references did not pass validation');
    });
  });

  describe('Publication', () => {
    beforeEach(() => {
      cy.visit(`/spaces/${defaultSpaceId}/entries/${defaultEntryId}`);
    });

    it('publishes release successfully', () => {
      getEntryReferences.willReturnSeveral();
      publishEntryReferencesResponse.willReturnNoErrors();

      cy.findByTestId('test-id-editor-builtin-reference-tree').click();
      cy.findByTestId('selectAllReferences').check();
      cy.findByTestId('publishReferencesBtn').click();

      cy.findByTestId('cf-ui-notification')
        .click({ timeout: 5000 })
        .should('be.visible')
        .should('contain', 'one and 2 references were published successfully');
    });

    it('publishes release returns validation errors', () => {
      getEntryReferences.willReturnSeveral();
      publishEntryReferencesResponse.willReturnErrors();

      cy.findByTestId('test-id-editor-builtin-reference-tree').click();
      cy.findByTestId('selectAllReferences').check();
      cy.findByTestId('publishReferencesBtn').click();

      cy.findByTestId('cf-ui-notification')
        .click({ timeout: 5000 })
        .should('be.visible')
        .should('contain', 'Some references did not pass validation');
    });

    it('publishes release fails', () => {
      getEntryReferences.willReturnSeveral();
      publishEntryReferencesResponse.willFail();

      cy.findByTestId('test-id-editor-builtin-reference-tree').click();
      cy.findByTestId('selectAllReferences').check();
      cy.findByTestId('publishReferencesBtn').click();

      cy.findByTestId('cf-ui-notification')
        .click({ timeout: 5000 })
        .should('be.visible')
        .should('contain', 'We were unable to publish one and 2 references');
    });

    it.skip('publishes release skipping unresolved entities', () => {
      getEntryReferences.willReturnSeveralWithUnresolved();
      publishEntryReferencesResponse.willReturnNoErrors();

      cy.findByTestId('test-id-editor-builtin-reference-tree').click();
      cy.findByTestId('selectAllReferences').check();

      cy.findByTestId('publishReferencesBtn').click();

      cy.findByTestId('cf-ui-notification')
        .click({ timeout: 5000 })
        .should('be.visible')
        .should('contain', 'one and 2 references were published successfully');
    });
  });

  describe('FeatureFlag: BulkActions enabled', () => {
    beforeEach(() => {
      cy.enableFeatureFlags([
        FeatureFlag.RELEASES,
        FeatureFlag.REFERENCE_TREE_BULK_ACTIONS_SUPPORT,
      ]);
      cy.visit(`/spaces/${defaultSpaceId}/entries/${defaultEntryId}`);
    });

    it('should publish Entities successfully', () => {
      getEntryReferences.willReturnSeveralWithVersion();
      queryForDefaultEntries.willFindMultiple();
      publishBulkAction.willSucceed();
      getBulkAction.willReturnStatusSucceeded();

      cy.findByTestId('test-id-editor-builtin-reference-tree').click();
      cy.findByTestId('selectAllReferences').check();

      cy.findByTestId('publishReferencesBtn').click();
      cy.findByTestId('cf-ui-notification')
        .click({ timeout: 5000 })
        .should('be.visible')
        .should('contain', 'one and 2 references were published successfully');
    });

    it('should display an error message when a BulkAction fails', () => {
      getEntryReferences.willReturnSeveralWithVersion();
      queryForDefaultEntries.willFindMultiple();
      publishBulkAction.willSucceed();
      getBulkAction.willReturnStatusFailed();

      cy.findByTestId('test-id-editor-builtin-reference-tree').click();
      cy.findByTestId('selectAllReferences').check();

      cy.findByTestId('publishReferencesBtn').click();
      cy.findByTestId('cf-ui-notification')
        .click({ timeout: 5000 })
        .should('be.visible')
        .should('contain', 'Some references did not pass validation');
    });
  });
});
