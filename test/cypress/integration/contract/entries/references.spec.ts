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
}

describe('Entry references', () => {
  const setupInteractions = () => {
    defaultRequestsMock({
      publicContentTypesResponse:
        ContentType.getAllPublicContentTypesInDefaultSpace.willReturnOneWithRefField,
    });
    User.queryFirst100UsersInDefaultSpace.willFindSeveral();

    Entry.getDefaultEntry.willReturnIt();
    Entry.queryLinksToDefaultEntry.willReturnNone();
    Entry.getFirst7SnapshotsOfDefaultEntry.willReturnNone();

    ContentType.getEditorInterfaceForDefaultContentType.willReturnOneWithoutSidebar();

    ProductCatalog.queryForTasksInDefaultSpace.willFindFeatureEnabled();
    ProductCatalog.queryForBasicAppsInDefaultSpace.willFindFeatureEnabled();
    ProductCatalog.queryForScheduledPublishingInDefaultSpace.willFindFeatureEnabled();
    ProductCatalog.queryForContentTagsInDefaultSpace.willFindFeatureEnabled();
    ProductCatalog.queryForReferencesTreeInDefaultSpace.willFindFeatureEnabled();
  };

  beforeEach(() => {
    setupTestServers();
    setupInteractions();
  });

  describe('Validation', () => {
    beforeEach(() => {
      cy.visit(`/spaces/${defaultSpaceId}/entries/${defaultEntryId}`);
    });

    it('should validate publishing entities successfully', () => {
      Entry.getEntryReferences.willReturnSeveralWithVersion();

      BulkAction.validateBulkAction.willSucceed();
      BulkAction.getValidateBulkAction.willReturnStatusSucceeded();

      cy.findByTestId('test-id-editor-builtin-reference-tree').click();
      cy.findByTestId('selectAllReferences').check();
      cy.findByTestId('validateReferencesBtn').click();

      cy.findByTestId('cf-ui-notification')
        .click({ timeout: 5000 }) // official cypress workaround for animation
        .should('be.visible')
        .should('contain', 'All references passed validation');
    });

    it('should display an error message when a validate BulkAction fails', () => {
      Entry.getEntryReferences.willReturnSeveralWithVersion();

      BulkAction.validateBulkAction.willSucceed();
      BulkAction.getValidateBulkAction.willReturnStatusFailed();

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

    /**
     * @todo Create the missing state with unresolved entities before activating this test [https://contentful.atlassian.net/browse/PUL-1706]
     * `entries/several-references-with-unresolved` doesn't exist in `content_api` yet.
     **/
    it.skip('publishes release skipping unresolved entities', () => {
      Entry.getEntryReferences.willReturnSeveralWithUnresolved();
      Entry.queryForDefaultEntries.willFindMultiple();

      BulkAction.publishBulkAction.willSucceed();
      BulkAction.getPublishBulkAction.willReturnStatusSucceeded();

      cy.findByTestId('test-id-editor-builtin-reference-tree').click();
      cy.findByTestId('selectAllReferences').check();

      cy.findByTestId('publishReferencesBtn').click();

      cy.findByTestId('cf-ui-notification')
        .click({ timeout: 5000 })
        .should('be.visible')
        .should('contain', 'one and 2 references were published successfully');
    });

    it('should publish entities successfully', () => {
      Entry.getEntryReferences.willReturnSeveralWithVersion();
      Entry.queryForDefaultEntries.willFindMultiple();

      BulkAction.publishBulkAction.willSucceed();
      BulkAction.getPublishBulkAction.willReturnStatusSucceeded();

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
      BulkAction.getPublishBulkAction.willReturnStatusFailed();

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
