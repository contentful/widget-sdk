import { defaultRequestsMock } from '../../../util/factories';
import {
  defaultSpaceId
} from '../../../util/requests';
import {
  getAllContentTypesInDefaultSpace,
  getFirst1000ContentTypesInDefaultSpaceOrderedByName
} from '../../../interactions/content_types';
const severalContentTypes = require('../../../fixtures/responses/content-types-several.json');

describe('Content types list page', () => {
  beforeEach(() => {
    cy.resetAllFakeServers();
  });

  context('with no content types', () => {
    beforeEach(() => {
      const interactions = [
        ...defaultRequestsMock(),
        getFirst1000ContentTypesInDefaultSpaceOrderedByName.willReturnNone()
      ];

      cy.visit(`/spaces/${defaultSpaceId}/content_types`);

      cy.wait(interactions);
    });

    it('Renders the page with no content types', () => {
      cy.getByTestId('create-content-type-empty-state')
        .should('be.visible')
        .should('be.enabled');
    });

    it('Shows no content type advice', () => {
      cy.getByTestId('no-content-type-advice').should('be.visible');
    });

    it('redirects correctly by "Add content type" button', () => {
      const interactions = [
        getAllContentTypesInDefaultSpace.willReturnNone()
      ];

      cy.getByTestId('create-content-type-empty-state').click();

      cy.wait(interactions);

      cy.url().should('contain', '/content_types_new/fields');
    });
  });

  context('with several content types', () => {
    beforeEach(() => {
      const interactions = [
        ...defaultRequestsMock(),
        getFirst1000ContentTypesInDefaultSpaceOrderedByName.willReturnSeveral()
      ];

      cy.visit(`/spaces/${defaultSpaceId}/content_types`);

      cy.wait(interactions);
    });

    it('Renders the page with several content types', () => {
      cy.getByTestId('cf-ui-table').should('be.visible');
      cy.getByTestId('create-content-type').should('be.visible');
      cy.getAllByTestId('content-type-item').should('have.length', severalContentTypes.total);
    });
  });
});
