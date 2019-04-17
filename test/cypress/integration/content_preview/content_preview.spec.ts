import { defaultRequestsMock } from '../../mocks/factories';
import * as state from '../../mocks/interactionState';

const spaceId = Cypress.env('spaceId');
const previewName = 'Test Name';
const previewDescription = 'Test Description';
const previewId = '0xi0FU6rvrUVlJtPFuaUyl';
const previewResponseBody = {
  name: previewName,
  description: previewDescription,
  sys: {
    type: 'PreviewEnvironment',
    id: previewId,
    version: 0,
    space: {
      sys: {
        type: 'Link',
        linkType: 'Space',
        id: spaceId
      }
    },
    createdAt: '2019-03-06T10:53:58Z',
    updatedAt: '2019-03-06T10:53:58Z'
  },
  configurations: []
};

describe('Content Preview Page', () => {
  beforeEach(() => {
    cy.setAuthTokenToLocalStorage();
    defaultRequestsMock();

    cy.visit(`/spaces/${spaceId}/settings/content_preview/new`);
  });

  describe('opening the page', () => {
    beforeEach(() => {
      cy.wait([`@${state.Token.VALID}`, `@${state.PreviewEnvironments.NONE}`]);
    });

    it('renders create new content preview page', () => {
      cy.getByTestId('cf-ui-form')
        .should('be.visible')
        .get('h3')
        .should('contain', 'Content preview URLs');
    });

    it('has a save button disabled', () => {
      cy.getByTestId('save-content-preview').should('be.disabled');
    });
  });

  describe('saving the content preview', () => {
    beforeEach(() => {
      cy.addInteraction({
        state: 'canAddPreviewEnvironments',
        uponReceiving: 'add preview environment request',
        withRequest: {
          method: 'POST',
          path: `/spaces/${spaceId}/preview_environments`,
          headers: {
            Accept: 'application/json, text/plain, */*'
          }
        },
        willRespondWith: {
          status: 201,
          body: previewResponseBody
        }
      }).as('addPreviewEnvironments');
    });

    it('submit the form correctly', () => {
      cy.getByTestId('cf-ui-text-input')
        .type(previewName)
        .should('have.value', previewName);
      cy.getByTestId('cf-ui-textarea')
        .type(previewDescription)
        .should('have.value', previewDescription);
      cy.getByTestId('save-content-preview')
        .should('be.enabled')
        .click();
      cy.getByTestId('cf-ui-notification').should('contain', 'success');
      cy.url().should('include', previewId);
    });
  });
});
