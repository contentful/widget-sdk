import { defaultRequestsMock } from '../../../util/factories';
import { queryFirst100UsersInDefaultSpace } from '../../../interactions/users';
import {
  getAllPublicContentTypesInDefaultSpace,
  getEditorInterfaceForDefaultContentType,
} from '../../../interactions/content_types';
import {
  getDefaultEntry,
  validateEntryReferencesResponse,
  queryLinksToDefaultEntry,
  getFirst7SnapshotsOfDefaultEntry,
  getEntryReferences,
} from '../../../interactions/entries';
import { defaultEntryId, defaultSpaceId } from '../../../util/requests';
import { FeatureFlag } from '../../../util/featureFlag';
import {
  queryForTasksAndAppsInDefaultSpace,
  queryForScheduledPublishingOnEntryPage,
} from '../../../interactions/product_catalog_features';

describe('Immediate release', () => {
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

      cy.getByTestId('referencesBtn').click();
      cy.wait(getEntryReferencesInteraction);

      cy.getByTestId('validateReferencesBtn').click();
      cy.wait(validateEntryTreeInteraction);

      cy.getByTestId('cf-ui-note-validation-success').should('be.visible');
    });

    it('validates release with errors', () => {
      const getEntryReferencesInteraction = getEntryReferences.willReturnSeveral();
      const validateEntryTreeInteraction = validateEntryReferencesResponse.willReturnErrors();

      cy.getByTestId('referencesBtn').click();
      cy.wait(getEntryReferencesInteraction);

      cy.getByTestId('validateReferencesBtn').click();
      cy.wait(validateEntryTreeInteraction);

      cy.getByTestId('cf-ui-note-validation-failed').should('be.visible');
    });
  });
});

function basicServerSetUp(): string[] {
  cy.resetAllFakeServers();
  // TODO: move this to a before block
  cy.startFakeServers({
    consumer: 'user_interface',
    providers: ['jobs', 'entries', 'users', 'product_catalog_features', 'releases'],
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
    queryForTasksAndAppsInDefaultSpace.willFindBothEnabled(),
    queryForScheduledPublishingOnEntryPage.willFindFeatureEnabled(),
  ];
}
