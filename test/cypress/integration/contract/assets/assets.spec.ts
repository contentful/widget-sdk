import { defaultRequestsMock } from '../../../util/factories';
import { singleUser } from '../../../interactions/users';
import * as state from '../../../util/interactionState';
import { defaultSpaceId } from '../../../util/requests';
import {
  noAssetsResponse,
  noArchivedAssetsResponse,
  severalAssetsResponse,
  severalAssetsBody
} from '../../../interactions/assets';

describe('Assets Page', () => {
  context('no assets in the space', () => {
    before(() => {
      cy.startFakeServer({
        consumer: 'user_interface',
        provider: 'assets',
        cors: true,
        pactfileWriteMode: 'merge'
      });

      cy.setAuthTokenToLocalStorage();

      cy.resetAllFakeServers();

      defaultRequestsMock();
      singleUser();
      noAssetsResponse();
      noArchivedAssetsResponse();

      cy.visit(`/spaces/${defaultSpaceId}/assets`);

      cy.wait([`@${state.Token.VALID}`, `@${state.Assets.NONE}`]);
    });
    describe('opening the page', () => {
      it('renders add asset button for empty state on assets list page', () => {
        cy.getByTestId('cf-ui-empty-state')
          .should('be.visible')
          .find('#new-asset-menu')
          .should('be.visible');
        cy.getByTestId('add-asset-menu-trigger-empty-state').should('be.enabled');
      });
    });
  });

  context('several assets in the space', () => {
    before(() => {
      cy.startFakeServer({
        consumer: 'user_interface',
        provider: 'assets',
        cors: true,
        pactfileWriteMode: 'merge'
      });

      cy.setAuthTokenToLocalStorage();

      cy.resetAllFakeServers();

      defaultRequestsMock();
      singleUser();
      severalAssetsResponse();

      cy.visit(`/spaces/${defaultSpaceId}/assets`);

      cy.wait([`@${state.Token.VALID}`, `@${state.Assets.SEVERAL}`]);
    });
    describe('opening the page', () => {
      it('renders table with items on assets list page', () => {
        cy.getByTestId('add-asset-menu-trigger').should('be.enabled');
        cy.getByTestId('assets-table').should('be.visible');
        cy.getAllByTestId('asset-table-row').should('have.length', severalAssetsBody.total);
      });
    });
  });
});
