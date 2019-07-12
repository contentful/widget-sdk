import { defaultRequestsMock } from '../../../util/factories';
import { singleUser } from '../../../interactions/users';
import * as state from '../../../util/interactionState';
import { defaultSpaceId, defaultAssetId } from '../../../util/requests';
import { getDefaultAssetInDefaultSpace } from '../../../interactions/assets';
import { noAssetLinksResponse } from '../../../interactions/entries';

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

      defaultRequestsMock();
      singleUser();

      getDefaultAssetInDefaultSpace.willReturnTheDefaultAsset();
      noAssetLinksResponse();
      cy.route('**/channel/**', []).as('shareJS');

      cy.visit(`/spaces/${defaultSpaceId}/assets/${defaultAssetId}`);
      cy.wait([`@${state.Token.VALID}`, `@${state.Assets.SEVERAL}`]);
    });

    it('renders asset fields and actions', () => {
      cy.getByTestId('change-state-published').should('be.visible');
      cy.getAllByTestId('entity-field-controls').should('have.length', 3);
    });
  });
});
