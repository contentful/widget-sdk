import { defaultRequestsMock } from '../../../util/factories';
import * as state from '../../../util/interactionState';
import { 
  defaultSpaceId,
  getExtensions
} from '../../../util/requests';
import {
  getAllContentTypesInDefaultSpace,
  getFirst1000ContentTypesInDefaultSpaceOrderedByName
} from '../../../interactions/content_types';
const empty = require('../../../fixtures/responses/empty.json');
const severalContentTypes = require('../../../fixtures/responses/content-types-several.json');

describe('Content types list page', () => {
  beforeEach(() => {
    cy.resetAllFakeServers();
  });

  context('with no content types', () => {
    beforeEach(() => {
      defaultRequestsMock();

      getFirst1000ContentTypesInDefaultSpaceOrderedByName.willReturnNoContentTypes();

      cy.visit(`/spaces/${defaultSpaceId}/content_types`);

      cy.wait([`@${state.Token.VALID}`, `@${state.ContentTypes.NONE}`]);
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
      cy.startFakeServer({
        consumer: 'user_interface',
        provider: 'extensions',
        cors: true,
        pactfileWriteMode: 'merge',
        spec: 2
      });

      cy.addInteraction({
        provider: 'extensions',
        state: 'noExtensions',
        uponReceiving: 'a request for all extensions',
        withRequest: getExtensions(),
        willRespondWith: {
          status: 200,
          body: empty
        }
      }).as('noExtensions');

      getAllContentTypesInDefaultSpace.willReturnNoContentTypes()

      cy.getByTestId('create-content-type-empty-state').click();

      cy.wait([`@${state.ContentTypes.NONE}`, '@noExtensions']);

      cy.url().should('contain', '/content_types_new/fields');
    });
  });

  context('with several content types', () => {
    beforeEach(() => {
      defaultRequestsMock();

      getFirst1000ContentTypesInDefaultSpaceOrderedByName.willReturnSeveralContentTypes();

      cy.visit(`/spaces/${defaultSpaceId}/content_types`);

      cy.wait([`@${state.Token.VALID}`, `@${state.ContentTypes.SEVERAL}`]);
    });

    it('Renders the page with several content types', () => {
      cy.getByTestId('cf-ui-table').should('be.visible');
      cy.getByTestId('create-content-type').should('be.visible');
      cy.getAllByTestId('content-type-item').should('have.length', severalContentTypes.total);
    });
  });
});
