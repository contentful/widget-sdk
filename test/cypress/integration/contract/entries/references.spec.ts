import { FeatureFlag } from '../../../util/featureFlag';
import { defaultRequestsMock } from '../../../util/factories';
import { defaultEntryId, defaultSpaceId } from '../../../util/requests';

import * as User from '../../../interactions/users';
import * as ContentType from '../../../interactions/content_types';
import * as Entry from '../../../interactions/entries';
import * as ProductCatalog from '../../../interactions/product_catalog_features';
import * as BulkAction from '../../../interactions/bulk_actions';

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
      publicContentTypesResponse: ContentType.getAllPublicContentTypesInDefaultSpace.willReturnOne,
    });
    User.queryFirst100UsersInDefaultSpace.willFindSeveral();

    Entry.getDefaultEntry.willReturnIt();
    Entry.queryLinksToDefaultEntry.willReturnNone();
    Entry.getFirst7SnapshotsOfDefaultEntry.willReturnNone();

    ContentType.getEditorInterfaceForDefaultContentType.willReturnOneWithoutSidebar();

    ProductCatalog.queryForTasksInDefaultSpace.willFindFeatureEnabled();
    ProductCatalog.queryForBasicAppsInDefaultSpace.willFindFeatureEnabled();
    ProductCatalog.queryForScheduledPublishingOnEntryPage.willFindFeatureEnabled();
    ProductCatalog.queryForContentTagsInDefaultSpace.willFindFeatureEnabled();
    ProductCatalog.queryForReleasesInDefaultSpace.willFindFeatureEnabled();
    ProductCatalog.getLaunchAppFeatureInDefaultSpace.willFindFeatureEnabled();
    ProductCatalog.getPerformancePackageFeatureInDefaultSpace.willFindFeatureDisabled();
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
      Entry.getEntryReferences.willReturnSeveral();
      Entry.validateEntryReferencesResponse.willReturnNoErrors();

      cy.findByTestId('test-id-editor-builtin-reference-tree').click();
      cy.findByTestId('selectAllReferences').check();
      cy.findByTestId('validateReferencesBtn').click();

      cy.findByTestId('cf-ui-notification')
        .click({ timeout: 5000 }) // official cypress workaround for animation
        .should('be.visible')
        .should('contain', 'All references passed validation');
    });

    it('validates release with errors', () => {
      Entry.getEntryReferences.willReturnSeveral();
      Entry.validateEntryReferencesResponse.willReturnErrors();

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
      Entry.getEntryReferences.willReturnSeveral();
      Entry.publishEntryReferencesResponse.willReturnNoErrors();

      cy.findByTestId('test-id-editor-builtin-reference-tree').click();
      cy.findByTestId('selectAllReferences').check();
      cy.findByTestId('publishReferencesBtn').click();

      cy.findByTestId('cf-ui-notification')
        .click({ timeout: 5000 })
        .should('be.visible')
        .should('contain', 'one and 2 references were published successfully');
    });

    it('publishes release returns validation errors', () => {
      Entry.getEntryReferences.willReturnSeveral();
      Entry.publishEntryReferencesResponse.willReturnErrors();

      cy.findByTestId('test-id-editor-builtin-reference-tree').click();
      cy.findByTestId('selectAllReferences').check();
      cy.findByTestId('publishReferencesBtn').click();

      cy.findByTestId('cf-ui-notification')
        .click({ timeout: 5000 })
        .should('be.visible')
        .should('contain', 'Some references did not pass validation');
    });

    it('publishes release fails', () => {
      Entry.getEntryReferences.willReturnSeveral();
      Entry.publishEntryReferencesResponse.willFail();

      cy.findByTestId('test-id-editor-builtin-reference-tree').click();
      cy.findByTestId('selectAllReferences').check();
      cy.findByTestId('publishReferencesBtn').click();

      cy.findByTestId('cf-ui-notification')
        .click({ timeout: 5000 })
        .should('be.visible')
        .should('contain', 'We were unable to publish one and 2 references');
    });

    it.skip('publishes release skipping unresolved entities', () => {
      Entry.getEntryReferences.willReturnSeveralWithUnresolved();
      Entry.publishEntryReferencesResponse.willReturnNoErrors();

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
      Entry.getEntryReferences.willReturnSeveralWithVersion();
      Entry.queryForDefaultEntries.willFindMultiple();

      BulkAction.publishBulkAction.willSucceed();
      BulkAction.getBulkAction.willReturnStatusSucceeded();

      cy.findByTestId('test-id-editor-builtin-reference-tree').click();
      cy.findByTestId('selectAllReferences').check();

      cy.findByTestId('publishReferencesBtn').click();
      cy.findByTestId('cf-ui-notification')
        .click({ timeout: 5000 })
        .should('be.visible')
        .should('contain', 'one and 2 references were published successfully');
    });

    it('should display an error message when a BulkAction fails', () => {
      Entry.getEntryReferences.willReturnSeveralWithVersion();
      Entry.queryForDefaultEntries.willFindMultiple();

      BulkAction.publishBulkAction.willSucceed();
      BulkAction.getBulkAction.willReturnStatusFailed();

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
