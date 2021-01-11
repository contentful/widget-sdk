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
} from '../../../interactions/entries';
import { defaultEntryId, defaultSpaceId } from '../../../util/requests';
import { FeatureFlag } from '../../../util/featureFlag';
import {
  queryForTasksInDefaultSpace,
  queryForBasicAppsInDefaultSpace,
  queryForScheduledPublishingOnEntryPage,
  queryForContentTagsInDefaultSpace,
} from '../../../interactions/product_catalog_features';
import { getBulkAction, publishBulkAction } from '../../../interactions/bulk_actions';

describe('Entry references', () => {
  let interactions: string[];

  beforeEach(() => {
    cy.enableFeatureFlags([FeatureFlag.RELEASES]);
    interactions = basicServerSetUp();
  });

  describe('Validation', () => {
    beforeEach(() => {
      cy.visit(`/spaces/${defaultSpaceId}/entries/${defaultEntryId}`);
      cy.wait(interactions, { timeout: 20000 });
      cy.resetAllFakeServers();
    });

    it('validates release without errors', () => {
      const getEntryReferencesInteraction = getEntryReferences.willReturnSeveral();
      const validateEntryTreeInteraction = validateEntryReferencesResponse.willReturnNoErrors();

      cy.findByTestId('test-id-editor-builtin-reference-tree').click();
      cy.findByTestId('selectAllReferences').check();
      cy.wait(getEntryReferencesInteraction);

      cy.findByTestId('validateReferencesBtn').click();
      cy.wait(validateEntryTreeInteraction);

      cy.findByTestId('cf-ui-notification')
        .click({ timeout: 5000 }) // official cypress workaround for animation
        .should('be.visible')
        .should('contain', 'All references passed validation');
    });

    it('validates release with errors', () => {
      const getEntryReferencesInteraction = getEntryReferences.willReturnSeveral();
      const validateEntryTreeInteraction = validateEntryReferencesResponse.willReturnErrors();

      cy.findByTestId('test-id-editor-builtin-reference-tree').click();
      cy.findByTestId('selectAllReferences').check();
      cy.wait(getEntryReferencesInteraction);

      cy.findByTestId('validateReferencesBtn').click();
      cy.wait(validateEntryTreeInteraction);

      cy.findByTestId('cf-ui-notification')
        .click({ timeout: 5000 })
        .should('be.visible')
        .should('contain', 'Some references did not pass validation');
    });
  });

  describe('Publication', () => {
    beforeEach(() => {
      cy.visit(`/spaces/${defaultSpaceId}/entries/${defaultEntryId}`);
      cy.wait(interactions, { timeout: 20000 });
      cy.resetAllFakeServers();
    });

    it('publishes release successfully', () => {
      const getEntryReferencesInteraction = getEntryReferences.willReturnSeveral();
      const publishEntryTreeInteraction = publishEntryReferencesResponse.willReturnNoErrors();

      cy.findByTestId('test-id-editor-builtin-reference-tree').click();
      cy.findByTestId('selectAllReferences').check();
      cy.wait(getEntryReferencesInteraction);

      cy.findByTestId('publishReferencesBtn').click();
      cy.wait(publishEntryTreeInteraction);
      cy.wait(getEntryReferencesInteraction);

      cy.findByTestId('cf-ui-notification')
        .click({ timeout: 5000 })
        .should('be.visible')
        .should('contain', 'one and 2 references were published successfully');
    });

    it('publishes release returns validation errors', () => {
      const getEntryReferencesInteraction = getEntryReferences.willReturnSeveral();
      const publishEntryTreeInteraction = publishEntryReferencesResponse.willReturnErrors();

      cy.findByTestId('test-id-editor-builtin-reference-tree').click();
      cy.findByTestId('selectAllReferences').check();
      cy.wait(getEntryReferencesInteraction);

      cy.findByTestId('publishReferencesBtn').click();
      cy.wait(publishEntryTreeInteraction);

      cy.findByTestId('cf-ui-notification')
        .click({ timeout: 5000 })
        .should('be.visible')
        .should('contain', 'Some references did not pass validation');
    });

    it('publishes release fails', () => {
      const getEntryReferencesInteraction = getEntryReferences.willReturnSeveral();
      const publishEntryTreeInteraction = publishEntryReferencesResponse.willFail();

      cy.findByTestId('test-id-editor-builtin-reference-tree').click();
      cy.findByTestId('selectAllReferences').check();
      cy.wait(getEntryReferencesInteraction);

      cy.findByTestId('publishReferencesBtn').click();
      cy.wait(publishEntryTreeInteraction);

      cy.findByTestId('cf-ui-notification')
        .click({ timeout: 5000 })
        .should('be.visible')
        .should('contain', 'We were unable to publish one and 2 references');
    });

    it.skip('publishes release skipping unresolved entities', () => {
      const getEntryReferencesInteraction = getEntryReferences.willReturnSeveralWithUnresolved();
      const publishEntryTreeInteraction = publishEntryReferencesResponse.willReturnNoErrors();

      cy.findByTestId('test-id-editor-builtin-reference-tree').click();
      cy.findByTestId('selectAllReferences').check();
      cy.wait(getEntryReferencesInteraction);

      cy.findByTestId('publishReferencesBtn').click();
      cy.wait(publishEntryTreeInteraction);
      cy.wait(getEntryReferencesInteraction);

      cy.findByTestId('cf-ui-notification')
        .click({ timeout: 5000 })
        .should('be.visible')
        .should('contain', 'one and 2 references were published successfully');
    });
  });

  describe.only('FeatureFlag: BulkActions enabled', () => {
    beforeEach(() => {
      cy.enableFeatureFlags([
        FeatureFlag.RELEASES,
        FeatureFlag.REFERENCE_TREE_BULK_ACTIONS_SUPPORT,
      ]);
      cy.visit(`/spaces/${defaultSpaceId}/entries/${defaultEntryId}`);
      cy.wait(interactions, { timeout: 20000 });
      cy.resetAllFakeServers();
    });

    it('should publish Entities successfully', () => {
      const getEntryReferencesInteraction = getEntryReferences.willReturnSeveralWithVersion();
      // const publishEntryTreeInteraction = publishEntryReferencesResponse.willReturnNoErrors();

      const publishEntryTreeInteraction = publishBulkAction.willSucceed();
      const getBulkActionRequest = getBulkAction.willSucceed();

      cy.findByTestId('test-id-editor-builtin-reference-tree').click();
      cy.findByTestId('selectAllReferences').check();
      cy.wait(getEntryReferencesInteraction);

      cy.findByTestId('publishReferencesBtn').click();
      cy.wait(publishEntryTreeInteraction);
      cy.wait(getBulkActionRequest);
      // cy.wait(getEntryReferencesInteraction);

      cy.findByTestId('cf-ui-notification')
        .click({ timeout: 5000 })
        .should('be.visible')
        .should('contain', 'one and 2 references were published successfully');
    });
  });
});

function basicServerSetUp(): string[] {
  cy.resetAllFakeServers();
  // TODO: move this to a before block
  cy.startFakeServers({
    consumer: 'user_interface',
    providers: ['jobs', 'entries', 'users', 'product_catalog_features', 'releases', 'bulk_actions'],
    cors: true,
    pactfileWriteMode: 'merge',
    dir: Cypress.env('pactDir'),
    spec: 2,
  });

  cy.server();
  cy.route('**/channel/**', []).as('shareJS');

  return [
    ...defaultRequestsMock({
      publicContentTypesResponse: getAllPublicContentTypesInDefaultSpace.willReturnOne,
    }),
    queryFirst100UsersInDefaultSpace.willFindSeveral(),
    getDefaultEntry.willReturnIt(),
    queryLinksToDefaultEntry.willReturnNone(),
    getFirst7SnapshotsOfDefaultEntry.willReturnNone(),
    getEditorInterfaceForDefaultContentType.willReturnOneWithoutSidebar(),
    queryForTasksInDefaultSpace.willFindFeatureEnabled(),
    queryForBasicAppsInDefaultSpace.willFindFeatureEnabled(),
    queryForScheduledPublishingOnEntryPage.willFindFeatureEnabled(),
    queryForContentTagsInDefaultSpace.willFindFeatureEnabled(),
    // getBulkAction.willSucceed(),
  ];
}
