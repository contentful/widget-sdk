import { defaultRequestsMock } from '../../../util/factories';
import { defaultSpaceId } from '../../../util/requests';
import {
  getEditorInterfaceForDefaultContentType,
  getAllContentTypesInDefaultSpace,
  getDefaultContentType,
  getPublishedVersionOfDefaultContentType,
  saveDefaultContentTypeWithNewField,
  publishDefaultContentTypeWithNewField,
  saveDefaultContentTypeEditorInterfaceWithNewField,
} from '../../../interactions/content_types';
import { defaultContentTypeId } from '../../../util/requests';

describe('Content type page', () => {
  context('content type with one field', () => {
    beforeEach(() => {
      cy.resetAllFakeServers();
      const interactions = [
        ...defaultRequestsMock(),
        getEditorInterfaceForDefaultContentType.willReturnOneWithoutSidebar(),
        getAllContentTypesInDefaultSpace.willReturnOne(),
        getDefaultContentType.willReturnIt(),
        getPublishedVersionOfDefaultContentType.willReturnIt(),
      ];
      cy.visit(`/spaces/${defaultSpaceId}/content_types/${defaultContentTypeId}`);
      cy.wait(interactions);
    });

    it('adds new Text field', () => {
      const fieldName = 'new text field';
      const fieldId = 'newTextField';
      const interactions = [
        saveDefaultContentTypeWithNewField.willSucceed({
          name: fieldName,
          apiName: fieldId,
          type: 'Symbol',
        }),
        publishDefaultContentTypeWithNewField.willSucceed({
          name: fieldName,
          apiName: fieldId,
          type: 'Symbol',
        }),
        saveDefaultContentTypeEditorInterfaceWithNewField.willSucceed({
          apiName: fieldId,
          widgetId: 'singleLine',
        }),
      ];

      cy.get('[name=contentTypeForm]').should('be.visible');
      cy.findByTestId('save-content-type').should('be.enabled');
      cy.findByTestId('add-field-button').should('be.enabled');
      cy.findByTestId('add-field-button').click();
      cy.findByLabelText('Text').click();
      cy.get('[name=fieldName]').type(fieldName);
      cy.get('[name=apiName]').should('have.value', fieldId);
      cy.findByText('Create').click();
      cy.get('.ct-field').contains(fieldName);
      cy.findByTestId('save-content-type').click();

      cy.wait(interactions);
    });

    it('adds new Number field', () => {
      const fieldName = 'new number field';
      const fieldId = 'newNumberField';
      const interactions = [
        saveDefaultContentTypeWithNewField.willSucceed({
          name: fieldName,
          apiName: fieldId,
          type: 'Integer',
        }),
        publishDefaultContentTypeWithNewField.willSucceed({
          name: fieldName,
          apiName: fieldId,
          type: 'Integer',
        }),
        saveDefaultContentTypeEditorInterfaceWithNewField.willSucceed({
          apiName: fieldId,
          widgetId: 'numberEditor',
        }),
      ];

      cy.get('[name=contentTypeForm]').should('be.visible');
      cy.findByTestId('save-content-type').should('be.enabled');
      cy.findByTestId('add-field-button').should('be.enabled');
      cy.findByTestId('add-field-button').click();
      cy.findByLabelText('Number').click();
      cy.get('[name=fieldName]').type(fieldName);
      cy.get('[name=apiName]').should('have.value', fieldId);
      cy.findByText('Create').click();
      cy.get('.ct-field').contains(fieldName);
      cy.findByTestId('save-content-type').click();

      cy.wait(interactions);
    });

    it('adds new Date field', () => {
      const fieldName = 'new Date field';
      const fieldId = 'newDateField';
      const interactions = [
        saveDefaultContentTypeWithNewField.willSucceed({
          name: fieldName,
          apiName: fieldId,
          type: 'Date',
        }),
        publishDefaultContentTypeWithNewField.willSucceed({
          name: fieldName,
          apiName: fieldId,
          type: 'Date',
        }),
        saveDefaultContentTypeEditorInterfaceWithNewField.willSucceed({
          apiName: fieldId,
          widgetId: 'datePicker',
        }),
      ];

      cy.get('[name=contentTypeForm]').should('be.visible');
      cy.findByTestId('save-content-type').should('be.enabled');
      cy.findByTestId('add-field-button').should('be.enabled');
      cy.findByTestId('add-field-button').click();
      cy.findByLabelText('Date and time').click();
      cy.get('[name=fieldName]').type(fieldName);
      cy.get('[name=apiName]').should('have.value', fieldId);
      cy.findByText('Create').click();
      cy.get('.ct-field').contains(fieldName);
      cy.findByTestId('save-content-type').click();

      cy.wait(interactions);
    });

    it('adds new Location field', () => {
      const fieldName = 'new Location field';
      const fieldId = 'newLocationField';
      const interactions = [
        saveDefaultContentTypeWithNewField.willSucceed({
          name: fieldName,
          apiName: fieldId,
          type: 'Location',
        }),
        publishDefaultContentTypeWithNewField.willSucceed({
          name: fieldName,
          apiName: fieldId,
          type: 'Location',
        }),
        saveDefaultContentTypeEditorInterfaceWithNewField.willSucceed({
          apiName: fieldId,
          widgetId: 'locationEditor',
        }),
      ];

      cy.get('[name=contentTypeForm]').should('be.visible');
      cy.findByTestId('save-content-type').should('be.enabled');
      cy.findByTestId('add-field-button').should('be.enabled');
      cy.findByTestId('add-field-button').click();
      cy.findByLabelText('Location').click();
      cy.get('[name=fieldName]').type(fieldName);
      cy.get('[name=apiName]').should('have.value', fieldId);
      cy.findByText('Create').click();
      cy.get('.ct-field').contains(fieldName);
      cy.findByTestId('save-content-type').click();

      cy.wait(interactions);
    });

    it('adds new Media field', () => {
      const fieldName = 'new Media field';
      const fieldId = 'newMediaField';
      const interactions = [
        saveDefaultContentTypeWithNewField.willSucceed({
          name: fieldName,
          apiName: fieldId,
          type: 'Link',
          linkType: 'Asset',
        }),
        publishDefaultContentTypeWithNewField.willSucceed({
          name: fieldName,
          apiName: fieldId,
          type: 'Link',
          linkType: 'Asset',
        }),
        saveDefaultContentTypeEditorInterfaceWithNewField.willSucceed({
          apiName: fieldId,
          widgetId: 'assetLinkEditor',
          linkType: 'Asset',
        }),
      ];

      cy.get('[name=contentTypeForm]').should('be.visible');
      cy.findByTestId('save-content-type').should('be.enabled');
      cy.findByTestId('add-field-button').should('be.enabled');
      cy.findByTestId('add-field-button').click();
      cy.findByLabelText('Media').click();
      cy.get('[name=fieldName]').type(fieldName);
      cy.get('[name=apiName]').should('have.value', fieldId);
      cy.findByText('Create').click();
      cy.get('.ct-field').contains(fieldName);
      cy.findByTestId('save-content-type').click();

      cy.wait(interactions);
    });

    it('adds new Boolean field', () => {
      const fieldName = 'new Boolean field';
      const fieldId = 'newBooleanField';
      const interactions = [
        saveDefaultContentTypeWithNewField.willSucceed({
          name: fieldName,
          apiName: fieldId,
          type: 'Boolean',
        }),
        publishDefaultContentTypeWithNewField.willSucceed({
          name: fieldName,
          apiName: fieldId,
          type: 'Boolean',
        }),
        saveDefaultContentTypeEditorInterfaceWithNewField.willSucceed({
          apiName: fieldId,
          widgetId: 'boolean',
        }),
      ];

      cy.get('[name=contentTypeForm]').should('be.visible');
      cy.findByTestId('save-content-type').should('be.enabled');
      cy.findByTestId('add-field-button').should('be.enabled');
      cy.findByTestId('add-field-button').click();
      cy.findByLabelText('Boolean').click();
      cy.get('[name=fieldName]').type(fieldName);
      cy.get('[name=apiName]').should('have.value', fieldId);
      cy.findByText('Create').click();
      cy.get('.ct-field').contains(fieldName);
      cy.findByTestId('save-content-type').click();

      cy.wait(interactions);
    });

    it('adds new JSON object field', () => {
      const fieldName = 'new JSON object field';
      const fieldId = 'newJsonObjectField';
      const interactions = [
        saveDefaultContentTypeWithNewField.willSucceed({
          name: fieldName,
          apiName: fieldId,
          type: 'Object',
        }),
        publishDefaultContentTypeWithNewField.willSucceed({
          name: fieldName,
          apiName: fieldId,
          type: 'Object',
        }),
        saveDefaultContentTypeEditorInterfaceWithNewField.willSucceed({
          apiName: fieldId,
          widgetId: 'objectEditor',
        }),
      ];

      cy.get('[name=contentTypeForm]').should('be.visible');
      cy.findByTestId('save-content-type').should('be.enabled');
      cy.findByTestId('add-field-button').should('be.enabled');
      cy.findByTestId('add-field-button').click();
      cy.findByLabelText('JSON object').click();
      cy.get('[name=fieldName]').type(fieldName);
      cy.get('[name=apiName]').should('have.value', fieldId);
      cy.findByText('Create').click();
      cy.get('.ct-field').contains(fieldName);
      cy.findByTestId('save-content-type').click();

      cy.wait(interactions);
    });

    it('adds new Reference field', () => {
      const fieldName = 'new Reference field';
      const fieldId = 'newReferenceField';
      const interactions = [
        saveDefaultContentTypeWithNewField.willSucceed({
          name: fieldName,
          apiName: fieldId,
          type: 'Link',
          linkType: 'Entry',
        }),
        publishDefaultContentTypeWithNewField.willSucceed({
          name: fieldName,
          apiName: fieldId,
          type: 'Link',
          linkType: 'Entry',
        }),
        saveDefaultContentTypeEditorInterfaceWithNewField.willSucceed({
          apiName: fieldId,
          widgetId: 'entryLinkEditor',
          linkType: 'Entry',
        }),
      ];

      cy.get('[name=contentTypeForm]').should('be.visible');
      cy.findByTestId('save-content-type').should('be.enabled');
      cy.findByTestId('add-field-button').should('be.enabled');
      cy.findByTestId('add-field-button').click();
      cy.findByLabelText('Reference').click();
      cy.get('[name=fieldName]').type(fieldName);
      cy.get('[name=apiName]').should('have.value', fieldId);
      cy.findByText('Create').click();
      cy.get('.ct-field').contains(fieldName);
      cy.findByTestId('save-content-type').click();

      cy.wait(interactions);
    });

    it('adds new Rich text field', () => {
      const fieldName = 'new Rich text field';
      const fieldId = 'newRichTextField';
      const interactions = [
        saveDefaultContentTypeWithNewField.willSucceed({
          name: fieldName,
          apiName: fieldId,
          type: 'RichText',
        }),
        publishDefaultContentTypeWithNewField.willSucceed({
          name: fieldName,
          apiName: fieldId,
          type: 'RichText',
        }),
        saveDefaultContentTypeEditorInterfaceWithNewField.willSucceed({
          apiName: fieldId,
          widgetId: 'richTextEditor',
        }),
      ];

      cy.get('[name=contentTypeForm]').should('be.visible');
      cy.findByTestId('save-content-type').should('be.enabled');
      cy.findByTestId('add-field-button').should('be.enabled');
      cy.findByTestId('add-field-button').click();
      cy.findByLabelText('Rich text').click();
      cy.get('[name=fieldName]').type(fieldName);
      cy.get('[name=apiName]').should('have.value', fieldId);
      cy.findByText('Create').click();
      cy.get('.ct-field').contains(fieldName);
      cy.findByTestId('save-content-type').click();

      cy.wait(interactions);
    });
  });
});
