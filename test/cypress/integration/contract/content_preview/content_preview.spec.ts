import { defaultRequestsMock } from '../../../util/factories';
import {
  defaultSpaceId,
  defaultPreviewName,
  defaultPreviewId,
  defaultPreviewDescription,
} from '../../../util/requests';
import { queryFirst100PreviewEnvironments } from '../../../interactions/preview_environments';

const previewResponseBody = {
  name: defaultPreviewName,
  description: defaultPreviewDescription,
  sys: {
    type: 'PreviewEnvironment',
    id: defaultPreviewId,
    version: 0,
    space: {
      sys: {
        type: 'Link',
        linkType: 'Space',
        id: defaultSpaceId,
      },
    },
    createdAt: '2019-03-06T10:53:58Z',
    updatedAt: '2019-03-06T10:53:58Z',
  },
  configurations: [],
};

describe('Content Preview Page', () => {
  beforeEach(() => {
    cy.resetAllFakeServers();

    const interactions = defaultRequestsMock();

    cy.visit(`/spaces/${defaultSpaceId}/settings/content_preview/new`);

    cy.wait(interactions);
  });

  describe('opening the page', () => {
    it('renders create new content preview page', () => {
      cy.findByTestId('cf-ui-form')
        .should('be.visible')
        .get('h3')
        .should('contain', 'Content preview URLs');
    });

    // TODO: Does this test belongs to contract tests?
    it('has a save button disabled', () => {
      cy.findByTestId('save-content-preview').should('be.disabled');
    });
  });

  describe('saving the content preview', () => {
    beforeEach(() => {
      // TODO: move this to a before block
      cy.startFakeServer({
        consumer: 'user_interface',
        provider: 'preview_environments',
        cors: true,
        pactfileWriteMode: 'merge',
        dir: Cypress.env('pactDir'),
        spec: 2,
      });

      // TODO: This should be moved to interactions/preview_environments
      cy.addInteraction({
        provider: 'preview_environments',
        state: 'canAddPreviewEnvironments',
        uponReceiving: 'add preview environment request',
        withRequest: {
          method: 'POST',
          path: `/spaces/${defaultSpaceId}/preview_environments`,
          headers: {
            Accept: 'application/json, text/plain, */*',
          },
        },
        willRespondWith: {
          status: 201,
          headers: {
            'Content-Type': 'application/vnd.contentful.management.v1+json',
          },
          body: previewResponseBody,
        },
      }).as('preview_environments/add');

      const interactions = [
        '@preview_environments/add',
        queryFirst100PreviewEnvironments.willFindNone(),
      ];

      cy.findByTestId('cf-ui-text-input')
        .type(defaultPreviewName)
        .should('have.value', defaultPreviewName);
      cy.findByTestId('cf-ui-textarea')
        .type(defaultPreviewDescription)
        .should('have.value', defaultPreviewDescription);
      cy.findByTestId('save-content-preview').should('be.enabled').click();

      cy.wait(interactions);
    });

    it('submit the form correctly', () => {
      cy.findByTestId('cf-ui-notification').should('contain', 'success');
      // TODO: Does this test belongs to contract tests?
      // NOTE: the app will navigate away from this page after a short time
      cy.url().should('include', defaultPreviewId);
    });
  });
});
