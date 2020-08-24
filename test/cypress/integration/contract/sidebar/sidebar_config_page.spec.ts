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
    it('renders the page with default configuration', () => {
      cy.findAllByTestId('selected-widget-name')
        .should('have.length', widgetNames.length)
        .each(($widget, index) => {
          cy.wrap($widget).should('have.text', widgetNames[index]);
        });
    });
  });

  describe('Enabling of a custom sidebar configuration option', () => {
    beforeEach(() => {
      cy.findByTestId('reset-widget-configuration').click();
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

      // Pick up and move Translation from slot 4 to slot 5
      // NOTE: Publish & Status is not draggable
      const originalTranslationDraggableIdx = 3;

      cy.findAllByTestId('selected-widget-item-draggable')
        .eq(originalTranslationDraggableIdx)
        .focus()
        .wait(0.2 * 1000)
        .trigger('keydown', { keyCode: space, force: true })
        .wait(0.2 * 1000)
        .trigger('keydown', { keyCode: arrowDown, force: true })
        .wait(0.2 * 1000)
        .trigger('keydown', { keyCode: space, force: true });
      cy.findByTestId('custom-sidebar-column').should('be.visible');
      cy.findAllByTestId('selected-widget-name').each(($widget, index) => {
        cy.wrap($widget).should('have.text', widgetsReordered[index]);
      });
    });

    it('moves widget from a custom sidebar to available items and vice versa', () => {
      cy.findAllByTestId('selected-widget-item')
        .eq(0)
        .findAllByTestId('remove-selected-widget')
        .eq(0)
        .click();
      cy.findAllByTestId('selected-widget-name')
        .should('have.length', widgetNames.length - 1)
        .should('not.contain', 'Publish & Status');
      cy.findAllByTestId('available-widget')
        .should('have.length', 1)
        .findByTestId('add-widget-to-selected')
        .click();
      cy.findAllByTestId('selected-widget-name').should('have.length', widgetNames.length);
    });

    it('can reset configuration after adding and removing items', () => {
      cy.findAllByTestId('selected-widget-item')
        .eq(0)
        .findAllByTestId('remove-selected-widget')
        .eq(0)
        .click();

      cy.findAllByTestId('selected-widget-item')
        .eq(0)
        .findAllByTestId('remove-selected-widget')
        .eq(0)
        .click();

      cy.findAllByTestId('selected-widget-name')
        .should('have.length', widgetNames.length - 2)
        .should('not.contain', 'Publish & Status');

      cy.findAllByTestId('available-widget').should('have.length', 2);

      cy.findByTestId('reset-widget-configuration').click();

      cy.findAllByTestId('selected-widget-name').should('have.length', widgetNames.length);
    });
  });
});
