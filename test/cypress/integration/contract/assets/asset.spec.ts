import { defaultRequestsMock } from '../../../util/factories';
import { queryFirst100UsersInDefaultSpace } from '../../../interactions/users';
import { defaultSpaceId, defaultAssetId } from '../../../util/requests';
import { getDefaultAssetInDefaultSpace } from '../../../interactions/assets';
import { queryLinksToDefaultAsset } from '../../../interactions/entries';

describe('Asset Page', () => {
  before(() =>
    cy.startFakeServers({
      consumer: 'user_interface',
      providers: ['assets', 'entries', 'users'],
      cors: true,
      pactfileWriteMode: 'merge',
      spec: 2
    })
  );

  context('asset with empty fields', () => {
    beforeEach(() => {
      cy.resetAllFakeServers();

      const interactions = [
        ...defaultRequestsMock(),
        queryFirst100UsersInDefaultSpace.willFindSeveral(),
        getDefaultAssetInDefaultSpace.willReturnIt(),
        queryLinksToDefaultAsset.willReturnNone()
      ];

      cy.server();
      cy.route('**/channel/**', []).as('shareJS');

      cy.visit(`/spaces/${defaultSpaceId}/assets/${defaultAssetId}`);

      cy.wait(interactions);
    });

    it('renders asset fields and actions', () => {
      cy.getByTestId('change-state-published').should('be.visible');
      cy.getAllByTestId('entity-field-controls').should('have.length', 3);
    });
  });
});
