import { defaultRequestsMock } from '../../../util/factories';
import { singleUser } from '../../../interactions/users';
import * as state from '../../../util/interactionState';
import { defaultSpaceId } from '../../../util/requests';
import {
  queryAllNonArchivedAssetsInTheDefaultSpace,
  severalAssetsBody,
  queryAllArchivedAssetsInTheDefaultSpace
} from '../../../interactions/assets';

describe('Assets List Page', () => {
  before(() =>
    cy.startFakeServers({
      consumer: 'user_interface',
      providers: ['assets', 'users'],
      cors: true,
      pactfileWriteMode: 'merge',
      spec: 2
    })
  );

  beforeEach(() => {
    cy.resetAllFakeServers();

    defaultRequestsMock();
    singleUser();
  });
  context('no assets in the space', () => {
    beforeEach(() => {
      queryAllNonArchivedAssetsInTheDefaultSpace.willFindNone();
      queryAllArchivedAssetsInTheDefaultSpace.willFindNone();

      cy.visit(`/spaces/${defaultSpaceId}/assets`);

      cy.wait([`@${state.Token.VALID}`, `@${state.Assets.NONE}`]);
    });
    it('renders add asset button for empty state on assets list page', () => {
      cy.getByTestId('cf-ui-empty-state')
        .should('be.visible')
        .find('#new-asset-menu')
        .should('be.visible');
      cy.getByTestId('add-asset-menu-trigger-empty-state').should('be.enabled');
    });
  });

  context('several assets in the space', () => {
    beforeEach(() => {
      queryAllNonArchivedAssetsInTheDefaultSpace.willFindSeveral();

      cy.visit(`/spaces/${defaultSpaceId}/assets`);

      cy.wait([`@${state.Token.VALID}`, `@${state.Assets.SEVERAL}`]);
    });
    it('renders table with items on assets list page', () => {
      cy.getByTestId('add-asset-menu-trigger').should('be.enabled');
      cy.getByTestId('assets-table').should('be.visible');
      cy.getAllByTestId('asset-table-row').should('have.length', severalAssetsBody.total);
    });
  });
});
