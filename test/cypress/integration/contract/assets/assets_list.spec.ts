import { defaultRequestsMock } from '../../../util/factories';
import { queryFirst100UsersInDefaultSpace } from '../../../interactions/users';
import { defaultSpaceId } from '../../../util/requests';
import {
  queryAllNonArchivedAssetsInTheDefaultSpace,
  severalAssetsBody,
} from '../../../interactions/assets';

describe('Assets List Page', () => {
  before(() => {
    cy.startFakeServers({
      consumer: 'user_interface',
      providers: ['assets', 'users'],
      cors: true,
      pactfileWriteMode: 'merge',
      dir: Cypress.env('pactDir'),
      spec: 2,
    });
  });

  let interactions: string[];
  beforeEach(() => {
    cy.resetAllFakeServers();

    interactions = [...defaultRequestsMock(), queryFirst100UsersInDefaultSpace.willFindSeveral()];
  });
  context('no assets in the space', () => {
    beforeEach(() => {
      interactions.push(queryAllNonArchivedAssetsInTheDefaultSpace.willFindNone());

      cy.visit(`/spaces/${defaultSpaceId}/assets`);

      cy.wait(interactions);
    });
    it('renders add asset button for empty state on assets list page', () => {
      // TODO: this page is sending redundant requests, causing the this to reload twice
      // eslint-disable-next-line cypress/no-unnecessary-waiting
      cy.wait(500);
      cy.getByTestId('cf-ui-empty-state')
        .should('be.visible')
        .find('#new-asset-menu')
        .should('be.visible');
      cy.getByTestId('add-asset-menu-trigger-empty-state').should('be.enabled');
    });
  });

  context('several assets in the space', () => {
    beforeEach(() => {
      interactions.push(queryAllNonArchivedAssetsInTheDefaultSpace.willFindSeveral());

      cy.visit(`/spaces/${defaultSpaceId}/assets`);

      cy.wait(interactions);
    });
    it('renders table with items on assets list page', () => {
      // TODO: this page is sending redundant requests, causing the this to reload twice
      // eslint-disable-next-line cypress/no-unnecessary-waiting
      cy.wait(500);
      cy.getByTestId('add-asset-menu-trigger').should('be.enabled');
      cy.getByTestId('asset-list').should('be.visible');
      cy.getAllByTestId('asset-row').should('have.length', severalAssetsBody.total);
    });
  });
});
