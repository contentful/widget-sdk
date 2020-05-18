import { defaultRequestsMock } from '../../../util/factories';
import {
  getDefaultContentType,
  getPublishedVersionOfDefaultContentType,
  getAllContentTypesInDefaultSpace,
} from '../../../interactions/content_types';
import { getEditorInterfaceForDefaultContentType } from '../../../interactions/content_types';
import { defaultContentTypeId, defaultSpaceId } from '../../../util/requests';

describe('Sidebar configuration', () => {
  beforeEach(() => {
    cy.resetAllFakeServers();

    const interactions = [
      ...defaultRequestsMock(),
      getEditorInterfaceForDefaultContentType.willReturnOneWithoutSidebar(),
      getAllContentTypesInDefaultSpace.willReturnOne(),
      getDefaultContentType.willReturnIt(),
      getPublishedVersionOfDefaultContentType.willReturnIt(),
    ];

    cy.visit(
      `/spaces/${defaultSpaceId}/content_types/${defaultContentTypeId}/sidebar_configuration`
    );

    cy.wait(interactions);
  });

  const widgetNames = ['Publish & Status', 'Preview', 'Links', 'Translation', 'Versions', 'Users'];

  describe('Opening the page with no configuration saved', () => {
    it('displays sidebar options correctly', () => {
      cy.findByTestId('default-sidebar-option').find('input').should('be.checked');
      cy.findByTestId('custom-sidebar-option').find('input').should('not.be.checked');
    });

    it('renders the page with a sidebar with no configurations', () => {
      cy.findByTestId('default-sidebar-column')
        .should('be.visible')
        .findAllByTestId('sidebar-widget-name')
        .should('have.length', widgetNames.length)
        .each(($widget, index) => {
          cy.wrap($widget).should('have.text', widgetNames[index]);
        });
    });
  });

  describe('Enabling of a custom sidebar configuration option', () => {
    beforeEach(() => {
      cy.findByTestId('custom-sidebar-option').find('input').click();
    });

    it('renders the page with custom sidebar configuration option enabled', () => {
      cy.findByTestId('custom-sidebar-column').should('be.visible');
      cy.findByTestId('available-sidebar-items').should('be.visible');
    });

    it('checks changing the order of widgets in custom sidebar', () => {
      const space: number = 32;
      const arrowDown: number = 40;
      const widgetsReordered = [
        'Publish & Status',
        'Preview',
        'Links',
        'Versions',
        'Translation',
        'Users',
      ];

      cy.findAllByTestId('sidebar-widget-item-draggable')
        .eq(3)
        .focus()
        .wait(0.2 * 1000)
        .trigger('keydown', { keyCode: space, force: true })
        .wait(0.2 * 1000)
        .trigger('keydown', { keyCode: arrowDown, force: true })
        .wait(0.2 * 1000)
        .trigger('keydown', { keyCode: space, force: true });
      cy.findByTestId('custom-sidebar-column').should('be.visible');
      cy.findAllByTestId('sidebar-widget-name').each(($widget, index) => {
        cy.wrap($widget).should('have.text', widgetsReordered[index]);
      });
    });

    it('moves widget from a custom sidebar to available items and vice versa', () => {
      cy.findAllByTestId('sidebar-widget-item')
        .eq(0)
        .findAllByTestId('cf-ui-icon-button')
        .eq(0)
        .click();
      cy.findAllByTestId('sidebar-widget-name')
        .should('have.length', widgetNames.length - 1)
        .should('not.contain', 'Publish & Status');
      cy.findAllByTestId('available-widget')
        .should('have.length', 1)
        .findByTestId('add-widget-to-sidebar')
        .click();
      cy.findAllByTestId('sidebar-widget-name').should('have.length', widgetNames.length);
    });
  });
});
