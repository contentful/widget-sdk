import { defaultRequestsMock } from '../../../util/factories';
import * as state from '../../../util/interactionState';
import { defaultSpaceId, getExtensions, getContentTypes } from '../../../util/requests';

const empty = require('../../../fixtures/responses/empty.json');
const severalContentTypes = require('../../../fixtures/responses/content-types-several.json');
const query = {
  limit: '1000',
  order: 'name'
};

describe('Content types list page', () => {
  beforeEach(() => {
    cy.resetAllFakeServers();
  });

  context('with no content types', () => {
    beforeEach(() => {
      defaultRequestsMock();

      cy.addInteraction({
        provider: 'content_types',
        state: 'noContentTypesWithQuery',
        uponReceiving: 'a request for all content types',
        withRequest: getContentTypes(defaultSpaceId, query),
        willRespondWith: {
          status: 200,
          body: empty
        }
      }).as('noContentTypesWithQuery');

      cy.visit(`/spaces/${defaultSpaceId}/content_types`);

      cy.wait([`@${state.Token.VALID}`, '@noContentTypesWithQuery']);
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

      cy.addInteraction({
        provider: 'content_types',
        state: 'noContentTypes',
        uponReceiving: 'a request for all content types',
        withRequest: getContentTypes(),
        willRespondWith: {
          status: 200,
          body: empty
        }
      }).as('noContentTypes');

      cy.getByTestId('create-content-type-empty-state').click();

      cy.wait(['@noContentTypes', '@noExtensions']);

      cy.url().should('contain', '/content_types_new/fields');
    });
  });

  context('with several content types', () => {
    beforeEach(() => {
      defaultRequestsMock();

      cy.addInteraction({
        provider: 'content_types',
        state: state.ContentTypes.SEVERAL,
        uponReceiving: 'a request for all content types',
        withRequest: getContentTypes(defaultSpaceId, query),
        willRespondWith: {
          status: 200,
          body: severalContentTypes
        }
      }).as(state.ContentTypes.SEVERAL);

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
