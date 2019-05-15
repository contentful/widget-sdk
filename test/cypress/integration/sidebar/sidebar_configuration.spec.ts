import { defaultRequestsMock } from '../../util/factories';
import {
  allContentTypesResponse,
  defaultContentTypeResponse,
  defaultPublishedContentTypeResponse
} from '../../interactions/content_types';
import { noExtensionsResponse } from '../../interactions/extensions';
import { editorInterfaceWithoutSidebarResponse } from '../../interactions/content_types';
import { defaultContentTypeId, defaultSpaceId } from '../../util/requests';
import * as state from '../../util/interactionState';

describe('Sidebar configuration', () => {
  before(() =>
    cy.startFakeServer({
      consumer: 'user_interface',
      provider: 'extensions',
      cors: true,
      pactfileWriteMode: 'merge',
      spec: 3
    })
  );

  before(() => {
    cy.setAuthTokenToLocalStorage();

    cy.resetAllFakeServers();

    defaultRequestsMock();
    noExtensionsResponse();
    editorInterfaceWithoutSidebarResponse();
    allContentTypesResponse();
    defaultContentTypeResponse();
    defaultPublishedContentTypeResponse();

    cy.visit(
      `/spaces/${defaultSpaceId}/content_types/${defaultContentTypeId}/sidebar_configuration`
    );

    cy.wait([`@${state.Token.VALID}`, `@${state.ContentTypes.EDITORINTERFACE_WITH_NO_SIDEBAR}`]);
  });

  const widgetNames = [
    'Publish & Status',
    'Preview',
    'Links',
    'Translation',
    'Versions',
    'Users',
    'Entry activity'
  ];

  describe('Opening the page with no configuration saved', () => {
    it('renders the page', () => {
      const expectedUrl = `/spaces/${defaultSpaceId}/content_types/${defaultContentTypeId}/sidebar_configuration`;
      cy.getByTestId('sidebar-config-tab')
        .should('be.visible')
        .should('have.attr', 'href')
        .and('eq', expectedUrl);
      cy.getByTestId('default-sidebar-option')
        .find('input')
        .should('be.checked');
      cy.getByTestId('custom-sidebar-option')
        .find('input')
        .should('not.be.checked');
    });

    it('renders the page with a sidebar with no configurations', () => {
      cy.getByTestId('default-sidebar-column')
        .should('be.visible')
        .getAllByTestId('sidebar-widget-name')
        .should('have.length', widgetNames.length)
        .each(($widget, index) => {
          cy.wrap($widget).should('have.text', widgetNames[index]);
        });
    });
  });

  // TODO: this seems not to be related to contract testing at all
  describe('Configuration of a custom sidebar', () => {
    before(() => {
      cy.resetAllFakeServers();

      cy.getByTestId('custom-sidebar-option')
        .find('input')
        .click();
    });

    it('renders the page with custom sidebar configuration', () => {
      cy.getByTestId('custom-sidebar-column').should('be.visible');
      cy.getByTestId('available-sidebar-items').should('be.visible');
    });

    it('checks changing the order of widgets in custom sidebar', () => {
      const space: number = 32;
      const arrowDown: number = 40;
      const widgetsReordered = [
        'Publish & Status',
        'Links',
        'Preview',
        'Translation',
        'Versions',
        'Users',
        'Entry activity'
      ];

      cy.get('[data-react-beautiful-dnd-drag-handle]')
        .eq(3)
        .focus()
        .trigger('keydown', { keyCode: space })
        .wait(0.2 * 1000)
        .trigger('keydown', { keyCode: arrowDown, force: true })
        .wait(0.2 * 1000)
        .trigger('keydown', { keyCode: space, force: true });
      cy.getByTestId('custom-sidebar-column').should('be.visible');
      cy.getAllByTestId('sidebar-widget-name').each(($widget, index) => {
        cy.wrap($widget).should('have.text', widgetsReordered[index]);
      });
    });

    it('moves widget from a custom sidebar to available items and vice versa', () => {
      cy.getByTestId('sidebar-widget-item')
        .eq(0)
        .getByTestId('cf-ui-icon-button')
        .click();
      cy.getAllByTestId('sidebar-widget-name')
        .should('have.length', widgetNames.length - 1)
        .should('not.contain', 'Publish & Status');
      cy.getAllByTestId('available-widget')
        .should('have.length', 1)
        .getByTestId('add-widget-to-sidebar')
        .click();
      cy.getAllByTestId('sidebar-widget-name').should('have.length', widgetNames.length);
    });
  });
});
