import { defaultRequestsMock } from '../../../util/factories';
import { defaultSpaceId } from '../../../util/requests';
import {
  getEditorInterfaceForDefaultContentType,
  getDefaultContentType,
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
        getDefaultContentType.willReturnIt(),
      ];
      cy.visit(`/spaces/${defaultSpaceId}/content_types/${defaultContentTypeId}`);
      cy.wait(interactions);
    });

    it('adds new Text field', () => {
      const fieldName = 'new text field';
      const fieldId = 'newTextField';
      const validations = [
        {
          size: {
            min: 10,
            max: 20,
          },
          message: 'message',
        },
      ];
      const interactions = [
        saveDefaultContentTypeWithNewField.willSucceed({
          name: fieldName,
          apiName: fieldId,
          type: 'Symbol',
          validations,
        }),
        publishDefaultContentTypeWithNewField.willSucceed({
          name: fieldName,
          apiName: fieldId,
          type: 'Symbol',
          validations,
        }),
        saveDefaultContentTypeEditorInterfaceWithNewField.willSucceed({
          apiName: fieldId,
          widgetId: 'singleLine',
        }),
      ];

      cy.get('[name=contentTypeForm]').should('be.visible');
      cy.findByTestId('add-field-button').should('be.enabled');
      cy.findByTestId('add-field-button').click();
      cy.findByLabelText('Text').click();
      cy.get('[name=fieldName]').type(fieldName);
      cy.get('[name=apiName]').should('have.value', fieldId);
      cy.findByText('Create').click();
      cy.get('.ct-field').contains(fieldName).parent().findByText('Settings').click();
      cy.findByText('Validation').click();
      cy.findByLabelText('Limit character count').check();
      cy.findByLabelText('Minimum size').type(validations[0].size.min.toString());
      cy.findByLabelText('Maximum size').type(validations[0].size.max.toString());
      cy.findByLabelText('Custom error message').type(validations[0].message);
      cy.findByTestId('confirm-field-dialog-form').click();
      cy.findByTestId('save-content-type').should('be.enabled');

      cy.findByTestId('save-content-type').click();

      cy.wait(interactions);
    });

    it('adds new Number field', () => {
      const fieldName = 'new number field';
      const fieldId = 'newNumberField';
      const validations = [
        {
          in: [1, 2, 3],
        },
      ];
      const interactions = [
        saveDefaultContentTypeWithNewField.willSucceed({
          name: fieldName,
          apiName: fieldId,
          type: 'Integer',
          validations,
        }),
        publishDefaultContentTypeWithNewField.willSucceed({
          name: fieldName,
          apiName: fieldId,
          type: 'Integer',
          validations,
        }),
        saveDefaultContentTypeEditorInterfaceWithNewField.willSucceed({
          apiName: fieldId,
          widgetId: 'numberEditor',
        }),
      ];

      cy.get('[name=contentTypeForm]').should('be.visible');
      cy.findByTestId('add-field-button').should('be.enabled');
      cy.findByTestId('add-field-button').click();
      cy.findByLabelText('Number').click();
      cy.get('[name=fieldName]').type(fieldName);
      cy.get('[name=apiName]').should('have.value', fieldId);
      cy.findByText('Create').click();
      cy.get('.ct-field').contains(fieldName).parent().findByText('Settings').click();
      cy.findByText('Validation').click();
      cy.findByLabelText('Accept only specified values').check();
      cy.findByLabelText('addPredefinedValue').type('1{enter}2{enter}3{enter}');
      cy.findByTestId('confirm-field-dialog-form').click();
      cy.findByTestId('save-content-type').should('be.enabled');

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
      cy.findByTestId('add-field-button').should('be.enabled');
      cy.findByTestId('add-field-button').click();
      cy.findByLabelText('Date and time').click();
      cy.get('[name=fieldName]').type(fieldName);
      cy.get('[name=apiName]').should('have.value', fieldId);
      cy.findByText('Create').click();
      cy.findByTestId('save-content-type').should('be.enabled');
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
      cy.findByTestId('add-field-button').should('be.enabled');
      cy.findByTestId('add-field-button').click();
      cy.findByLabelText('Location').click();
      cy.get('[name=fieldName]').type(fieldName);
      cy.get('[name=apiName]').should('have.value', fieldId);
      cy.findByText('Create').click();
      cy.findByTestId('save-content-type').should('be.enabled');

      cy.findByTestId('save-content-type').click();

      cy.wait(interactions);
    });

    it('adds new Media field', () => {
      const fieldName = 'new Media field';
      const fieldId = 'newMediaField';
      const validations = [
        {
          linkMimetypeGroup: ['attachment'],
        },
      ];
      const interactions = [
        saveDefaultContentTypeWithNewField.willSucceed({
          validations,
          name: fieldName,
          apiName: fieldId,
          type: 'Link',
          linkType: 'Asset',
        }),
        publishDefaultContentTypeWithNewField.willSucceed({
          validations,
          name: fieldName,
          apiName: fieldId,
          type: 'Link',
          linkType: 'Asset',
        }),
        saveDefaultContentTypeEditorInterfaceWithNewField.willSucceed({
          apiName: fieldId,
          widgetId: 'assetLinkEditor',
        }),
      ];

      cy.get('[name=contentTypeForm]').should('be.visible');
      cy.findByTestId('add-field-button').should('be.enabled');
      cy.findByTestId('add-field-button').click();
      cy.findByLabelText('Media').click();
      cy.get('[name=fieldName]').type(fieldName);
      cy.get('[name=apiName]').should('have.value', fieldId);
      cy.findByText('Create and configure').click();
      cy.findByText('Validation').click();
      cy.findByLabelText('Accept only specified file types').check();
      cy.findByLabelText('Attachment').check();
      cy.findByTestId('confirm-field-dialog-form').click();
      cy.findByTestId('save-content-type').should('be.enabled');

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
      cy.findByTestId('add-field-button').should('be.enabled');
      cy.findByTestId('add-field-button').click();
      cy.findByLabelText('Boolean').click();
      cy.get('[name=fieldName]').type(fieldName);
      cy.get('[name=apiName]').should('have.value', fieldId);
      cy.findByText('Create').click();
      cy.findByTestId('save-content-type').should('be.enabled');

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
      cy.findByTestId('add-field-button').should('be.enabled');
      cy.findByTestId('add-field-button').click();
      cy.findByLabelText('JSON object').click();
      cy.get('[name=fieldName]').type(fieldName);
      cy.get('[name=apiName]').should('have.value', fieldId);
      cy.findByText('Create').click();
      cy.findByTestId('save-content-type').should('be.enabled');

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
        }),
      ];

      cy.get('[name=contentTypeForm]').should('be.visible');
      cy.findByTestId('add-field-button').should('be.enabled');
      cy.findByTestId('add-field-button').click();
      cy.findByLabelText('Reference').click();
      cy.get('[name=fieldName]').type(fieldName);
      cy.get('[name=apiName]').should('have.value', fieldId);
      cy.findByText('Create').click();
      cy.findByTestId('save-content-type').should('be.enabled');

      cy.findByTestId('save-content-type').click();

      cy.wait(interactions);
    });

    it('adds new Rich text field', () => {
      const fieldName = 'new Rich text field';
      const fieldId = 'newRichTextField';
      const validations = [
        {
          enabledNodeTypes: [
            'heading-4',
            'heading-5',
            'heading-6',
            'ordered-list',
            'unordered-list',
            'hr',
            'blockquote',
            'embedded-asset-block',
            'entry-hyperlink',
            'asset-hyperlink',
            'embedded-entry-inline',
          ],
          message:
            'Only heading 4, heading 5, heading 6, ordered list, unordered list, horizontal rule, quote, asset, link to entry, link to asset, and inline entry nodes are allowed',
        },
        {
          nodes: {
            'embedded-asset-block': [
              {
                size: {
                  min: 1,
                  max: 5,
                },
                message: null,
              },
            ],
          },
        },
      ];
      const interactions = [
        saveDefaultContentTypeWithNewField.willSucceed({
          validations,
          name: fieldName,
          apiName: fieldId,
          type: 'RichText',
        }),
        publishDefaultContentTypeWithNewField.willSucceed({
          validations,
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
      cy.findByTestId('add-field-button').should('be.enabled');
      cy.findByTestId('add-field-button').click();
      cy.findByLabelText('Rich text').click();
      cy.get('[name=fieldName]').type(fieldName);
      cy.get('[name=apiName]').should('have.value', fieldId);
      cy.findByText('Create and configure').click();
      cy.findByText('H1').click();
      cy.findByText('H2').click();
      cy.findByText('H3').click();
      cy.findByText('Link to URL').click();
      cy.findByText('Entry').click();
      cy.findAllByText('Validation').click();
      cy.findByTestId('field-validations--embeddedAssetBlockSize')
        .findByLabelText('Limit number of entries')
        .check();
      cy.findByLabelText('Minimum size').type('1');
      cy.findByLabelText('Maximum size').type('5');
      cy.findByTestId('confirm-field-dialog-form').click();
      cy.findByTestId('save-content-type').should('be.enabled');

      cy.findByTestId('save-content-type').click();

      cy.wait(interactions);
    });
  });
});
