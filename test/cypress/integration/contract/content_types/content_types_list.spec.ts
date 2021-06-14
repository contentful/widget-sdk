import { defaultRequestsMock } from '../../../util/factories';
import { defaultSpaceId } from '../../../util/requests';
import { getFirst1000ContentTypesInDefaultSpaceOrderedByName } from '../../../interactions/content_types';
const severalContentTypes = require('../../../fixtures/responses/content-types-several.json');

describe('Content types list page', () => {
  beforeEach(() => {
    cy.startFakeServers({
      consumer: 'user_interface',
      providers: ['users', 'resources', 'plans', 'content_types', 'product_catalog_features'],
      cors: true,
      pactfileWriteMode: 'merge',
      dir: Cypress.env('pactDir'),
      spec: 2,
    });
    cy.resetAllFakeServers();
  });

  context('with no content types', () => {
    beforeEach(() => {
      const interactions = [
        ...defaultRequestsMock({}),
        getFirst1000ContentTypesInDefaultSpaceOrderedByName.willReturnNone(),
      ];

      cy.visit(`/spaces/${defaultSpaceId}/content_types`);

      cy.wait(interactions);
    });

    it('Renders the page with no content types', () => {
      cy.findByTestId('create-content-type-empty-state').should('be.visible').should('be.enabled');
    });

    it('Shows no content type advice', () => {
      cy.findByTestId('no-content-type-advice').should('be.visible');
    });

    it('redirects correctly by "Add content type" button', () => {
      cy.findByTestId('create-content-type-empty-state').click();
      cy.url().should('contain', '/content_types/new/fields');
    });
  });

  context('with several content types', () => {
    beforeEach(() => {
      const interactions = [
        ...defaultRequestsMock(),
        getFirst1000ContentTypesInDefaultSpaceOrderedByName.willReturnSeveral(),
      ];

      cy.visit(`/spaces/${defaultSpaceId}/content_types`);

      cy.wait(interactions);
    });

    it('Renders the page with several content types', () => {
      cy.findByTestId('cf-ui-table').should('be.visible');
      cy.findByTestId('create-content-type').should('be.visible');
      cy.findAllByTestId('content-type-item').should('have.length', severalContentTypes.total);
    });
  });
});
