import { defaultRequestsMock } from '../../util/factories';
import * as state from '../../util/interactionState';
import { defaultSpaceId, getExtensions, getContentTypes } from '../../util/requests';

const empty = require('../../fixtures/empty.json');
const query = 'limit=1000&order=name';

describe('Content types list page', () => {
  before(() => cy.startFakeServer({
    consumer: 'user_interface',
    provider: 'extensions',
    cors: true,
    pactfileWriteMode: 'merge'
  }))

  beforeEach(() => {
    cy.setAuthTokenToLocalStorage();

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

    cy.wait([`@${state.Token.VALID}`, `@${state.PreviewEnvironments.NONE}`, '@noContentTypesWithQuery']);
  });

  describe('Opening the page with no content types', () => {
    it('Renders the page', () => {
      cy.getByTestId('create-content-type-empty-state')
        .should('be.visible')
        .should('be.enabled');
    });

    it('Shows no content type advice', () => {
      cy.getByTestId('no-content-type-advice').should('be.visible');
    });
  });

  describe('The "Add content type" button', () => {
    it('redirects correctly', () => {
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
  })
});
