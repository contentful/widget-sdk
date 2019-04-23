import { defaultRequestsMock } from '../../util/factories';
import * as state from '../../util/interactionState';
import { defaultSpaceId, getExtensions, getContentTypes } from '../../util/requests';

const empty = require('../../fixtures/empty.json');
const query = 'limit=1000&order=name';

describe('Content types list page', () => {
  before(() => {
    cy.setAuthTokenToLocalStorage();
    defaultRequestsMock();

    cy.addInteraction({
      state: 'noContentTypesWithQuery',
      uponReceiving: 'a request for all content types',
      withRequest: getContentTypes(defaultSpaceId, query),
      willRespondWith: {
        status: 200,
        body: empty
      }
    }).as('noContentTypes');
    cy.visit(`/spaces/${defaultSpaceId}/content_types`);
    cy.wait([`@${state.Token.VALID}`, `@${state.PreviewEnvironments.NONE}`]);
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
    it('Add content type button redirects correctly', () => {
      cy.addInteraction({
        state: 'noExtensions',
        uponReceiving: 'a request for all extensions',
        withRequest: getExtensions(),
        willRespondWith: {
          status: 200,
          body: empty
        }
      }).as('noExtensions');
      cy.addInteraction({
        state: 'noContentTypes',
        uponReceiving: 'a request for all content types',
        withRequest: getContentTypes(),
        willRespondWith: {
          status: 200,
          body: empty
        }
      }).as('noContentTypes');
      cy.getByTestId('create-content-type-empty-state').click();
      cy.url().should('contain', '/content_types_new/fields');
    });
  });
});
