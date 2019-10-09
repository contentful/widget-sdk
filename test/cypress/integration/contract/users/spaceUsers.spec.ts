import { defaultRequestsMock } from '../../../util/factories';
import { defaultHeader, defaultSpaceId, defaultOrgId } from '../../../util/requests';

const empty = require('../../../fixtures/responses/empty.json');

const loadPageWithServerState = (stateName, responseBody, message) => {
  cy.setAuthTokenToLocalStorage();

  cy.resetAllFakeServers();

  const interactions = [
    ...defaultRequestsMock()
  ];

  cy.visit(`/spaces/${defaultSpaceId}/settings/teams`);

  cy.wait(interactions);
};

describe('Users in space page', () => {
  before(() => {
    cy.startFakeServers({
      consumer: 'user_interface',
      providers: ['users', 'roles', 'product_catalog_features'],
      cors: true,
      pactfileWriteMode: 'merge',
      dir: Cypress.env('pactDir'),
      spec: 2
    });
  });

  describe('inviting a user into a space', () => {
    it('send user invitation request and display user in list', () => {

    });
  });
});
