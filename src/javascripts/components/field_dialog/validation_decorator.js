'use strict';

angular
  .module('contentful')

  /**
   * @ngdoc service
   * @name validationDecorator
   */
  .factory('validationDecorator', [
    'require',
    require => {
      const _ = require('lodash');
      const pluralize = require('pluralize');
      const validationViews = require('validationViews');
      const createSchema = require('validation');
      const getErrorMessage = require('validationDialogErrorMessages');
      const { BLOCKS, MARKS, INLINES } = require('@contentful/rich-text-types');

      const validationName = createSchema.Validation.getName;
      const validationTypesForField = createSchema.Validation.forField;

      const validationSettings = {
        size: { min: null, max: null },
        range: { min: null, max: null },
        dateRange: { after: null, before: null },
        regexp: { pattern: null, flags: null },
        in: null,
        unique: true,
        linkContentType: null,
        linkMimetypeGroup: null,
        assetFileSize: { min: null, max: null },
        assetImageDimensions: {
          width: { min: null, max: null },
          height: { min: null, max: null }
        },
        enabledNodeTypes: null,
        enabledMarks: null,
        nodes: { size: { min: null, max: null } }
      };

      const validationLabels = {
        size: {
          Text: 'Limit character count',
          Symbol: 'Limit character count',
          Object: 'Limit number of properties'
        },
        range: 'Accept only specified number range',
        dateRange: 'Accept only specified date range',
        regexp: 'Match a specific pattern',
        unique: 'Unique field',
        in: 'Accept only specified values',
        linkContentType: 'Accept only specified entry type',
        linkMimetypeGroup: 'Accept only specified file types',
        assetFileSize: 'Accept only specified file size',
        assetImageDimensions: 'Accept only specified image dimensions',
        enabledNodeTypes: 'Accept only specified node types',
        enabledMarks: 'Accept only specified marks'
      };

      const validationHelpText = {
        size: {
          Text: 'Specify a minimum and/or maximum allowed number of characters',
          Symbol: 'Specify a minimum and/or maximum allowed number of characters',
          Object: 'Specify a minimum and/or maximum allowed number of properties'
        },
        range: 'Specify a minimum and/or maximum allowed number for this field',
        dateRange: 'Specify an early and/or latest allowed date for this field',
        regexp:
          'Make this field match a pattern: e-mail address, URI, or a custom regular expression',
        unique:
          "You won't be able to publish an entry if there is an existing entry with identical content",
        in:
          "You won't be able to publish an entry if the field value is not in the list of specified values",
        linkContentType: 'Make this field only accept entries from specified content type(s)',
        linkMimetypeGroup: 'Make this field only accept specified file types',
        assetFileSize: 'Specify a minimum and/or maximum allowed file size',
        assetImageDimensions: 'Specify a minimum and/or maximum allowed image dimension',
        enabledNodeTypes: 'Make this field only accept nodes from specified node type(s)',
        enabledMarks: 'Make this field only accept marks from specified mark type(s)'
      };

      const validationsOrder = [
        'unique',
        'size',
        'range',
        'dateRange',
        'regexp',
        'linkContentType',
        'linkMimeType',
        'assetFileSize',
        'in',
        'enabledNodeTypes',
        'enabledMarks',
        'nodes'
      ];

      const structuredTextOptionsLabels = {
        [BLOCKS.HEADING_1]: 'Heading 1',
        [BLOCKS.HEADING_2]: 'Heading 2',
        [BLOCKS.HEADING_3]: 'Heading 3',
        [BLOCKS.HEADING_4]: 'Heading 4',
        [BLOCKS.HEADING_5]: 'Heading 5',
        [BLOCKS.HEADING_6]: 'Heading 6',
        [MARKS.BOLD]: 'Bold',
        [MARKS.ITALIC]: 'Italic',
        [MARKS.UNDERLINE]: 'Underline',
        [MARKS.CODE]: 'Code',
        [BLOCKS.UL_LIST]: 'Unordered list',
        [BLOCKS.OL_LIST]: 'Ordered list',
        [BLOCKS.QUOTE]: 'Quote',
        [BLOCKS.HR]: 'Horizontal rule',
        [BLOCKS.EMBEDDED_ENTRY]: 'Block Entry',
        [INLINES.EMBEDDED_ENTRY]: 'Inline Entry',
        [INLINES.HYPERLINK]: 'Link to Url',
        [INLINES.ENTRY_HYPERLINK]: 'Link to entry',
        [INLINES.ASSET_HYPERLINK]: 'Link to asset'
      };

      const schema = createSchema({ type: 'Validation' });

      return {
        decorateFieldValidations: decorateFieldValidations,
        extractAll: extractAll,
        validate: validate,
        validateAll: validateAll,
        updateField: updateField,
        addEnabledStructuredTextOptions: addEnabledStructuredTextOptions
      };

      /**
       * @ngdoc method
       * @name validationDecorator#decorateFieldValidations
       * @param {Field} field
       * @returns {DecoratedValidation[]}
       */
      function decorateFieldValidations(field) {
        const types = _.filter(validationTypesForField(field), t => t in validationSettings);

        let fieldValidations = _.map(types, validationDecorator(field));

        if (field.items) {
          let itemValidations = decorateFieldValidations(field.items);
          _.each(itemValidations, v => {
            v.onItems = true;
          });

          // remove unique validation for items as we don't support
          // it for items nor for the Array container type
          itemValidations = _.filter(itemValidations, validation => validation.type !== 'unique');

          fieldValidations = itemValidations.concat(fieldValidations);
        }

        return _.sortBy(fieldValidations, validation => validationsOrder.indexOf(validation.type));
      }

      function validationDecorator(field) {
        return function decorateValidation(type) {
          const fieldValidation = findValidationByType(field.validations, type);
          let settings, enabled, message;

          if (fieldValidation) {
            enabled = true;
            settings = fieldValidation[type];
            message = fieldValidation.message;
          } else {
            enabled = false;
            settings = validationSettings[type];
            message = null;
          }

          const name = getValidationLabel(field, type);
          const views = validationViews.get(type);
          const currentView = views && views[0].name;
          const helpText = getValidationHelpText(field, type);

          return {
            name: name,
            helpText: helpText,
            type: type,
            onItems: false,
            enabled: enabled,
            message: message,
            settings: _.cloneDeep(settings),
            views: views,
            currentView: currentView
          };
        };
      }

      /**
       * @ngdoc method
       * @name validationDecorator#extractAll
       * @param {DecoratedValidation[]} decorated
       * @returns {Validation[]}
       */
      function extractAll(decorated) {
        const enabled = _.filter(decorated, 'enabled');
        return _.map(enabled, extractOne);
      }

      function extractOne(decorated) {
        const extracted = {};
        extracted[decorated.type] = _.cloneDeep(decorated.settings);
        if (decorated.message) {
          extracted.message = decorated.message;
        }
        return extracted;
      }

      /**
       * @ngdoc method
       * @name validationDecorator#validate
       * @param {DecoratedValidation} validation
       * @return {Error[]}
       */
      function validate(validation) {
        let errors = [];
        if (validation.enabled) {
          errors = schema.errors(extractOne(validation));
        }

        return _.forEach(errors, error => {
          error.path = [];
          error.message = getErrorMessage(validation.type, error);
        });
      }

      /**
       * @ngdoc method
       * @name validationDecorator#updateField
       * @description
       * Set the fields validations by extracting all enabled decorated
       * validations.
       *
       * This is the inverse of `decorateFieldValidations`.
       *
       * @param {ContentType.Field} field
       * @param {DecoratedValdiation[]} validations
       */
      function updateField(field, validations) {
        const baseValidations = _.filter(validations, { onItems: false });
        const itemValidations = _.filter(validations, { onItems: true });

        field.validations = extractAll(baseValidations);
        if (!_.isEmpty(itemValidations)) {
          field.items.validations = extractAll(itemValidations);
        }
      }

      function addEnabledStructuredTextOptions(field, options) {
        const { enabledNodeTypes, enabledMarks } = options;

        const validationsCopy = field.validations.filter(
          validation => !(validation.enabledMarks || validation.enabledNodeTypes)
        );

        if (enabledMarks) {
          validationsCopy.push({
            enabledMarks: enabledMarks,
            message: `Only the following mark(s) allowed: ${
              enabledMarks.length > 0
                ? enabledMarks.map(mark => structuredTextOptionsLabels[mark]).join(', ')
                : 'none'
            }`
          });
        }
        if (enabledNodeTypes) {
          validationsCopy.push({
            enabledNodeTypes: enabledNodeTypes,
            message: `Only the following node(s) allowed: ${
              enabledNodeTypes.length > 0
                ? enabledNodeTypes.map(node => structuredTextOptionsLabels[node]).join(', ')
                : 'none'
            }`
          });
        }
        field.validations = validationsCopy;
      }

      function validateAll(decoratedValidations) {
        return _.reduce(
          decoratedValidations,
          (allErrors, validation, index) => {
            const errors = validate(validation);
            _.forEach(errors, error => {
              error.path = [index].concat(error.path);
            });
            return allErrors.concat(errors);
          },
          []
        );
      }

      /**
       * Return the index and the settings for the validation of type
       * `type` from a list of `validations`.
       */
      function findValidationByType(validations, name) {
        return _.find(validations, validation => validationName(validation) === name);
      }

      function getValidationLabel(field, type) {
        if (field.type === 'Array' && type === 'size') {
          const itemTypes = pluralize((field.items.linkType || field.items.type).toLowerCase());

          return 'Accept only a specified number of ' + itemTypes;
        }

        return getValidationStringForType(validationLabels, field, type);
      }

      function getValidationHelpText(field, type) {
        if (field.type === 'Array' && type === 'size') {
          const itemTypes = pluralize((field.items.linkType || field.items.type).toLowerCase());

          return 'Specify a minimum and/or maximum allowed number of ' + itemTypes;
        }

        return getValidationStringForType(validationHelpText, field, type);
      }

      function getValidationStringForType(object, field, type) {
        const label = object[type];

        if (!label) {
          return type;
        } else if (_.isString(label)) {
          return label;
        } else {
          return label[field.type];
        }
      }
    }
  ]);
