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
      const { capitalize, joinWithAnd } = require('utils/StringUtils.es6');
      const validationViews = require('validationViews');
      const createSchema = require('validation');
      const getErrorMessage = require('validationDialogErrorMessages');
      const { BLOCKS, MARKS, INLINES } = require('@contentful/rich-text-types');

      const validationName = createSchema.Validation.getName;
      const nodeValidationName = createSchema.Validation.getNodeValidationName;
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
        }
      };

      const validationLabels = {
        size: {
          Text: 'Limit character count',
          Symbol: 'Limit character count',
          Object: 'Limit number of properties',
          RichText: 'Limit character count',
          // TODO: Remove when we are no longer using the legacy
          // `StructuredText` identifier
          StructuredText: 'Limit character count'
        },
        range: 'Accept only specified number range',
        dateRange: 'Accept only specified date range',
        regexp: 'Match a specific pattern',
        unique: 'Unique field',
        in: 'Accept only specified values',
        linkContentType: 'Accept only specified entry type',
        linkMimetypeGroup: 'Accept only specified file types',
        assetFileSize: 'Accept only specified file size',
        assetImageDimensions: 'Accept only specified image dimensions'
      };

      const validationHelpText = {
        size: {
          Text: 'Specify a minimum and/or maximum allowed number of characters',
          Symbol: 'Specify a minimum and/or maximum allowed number of characters',
          Object: 'Specify a minimum and/or maximum allowed number of properties',
          RichText: 'Specify a minimum and/or maximum allowed number of characters',
          // TODO: Remove when we are no longer using the legacy
          // `StructuredText` identifier
          StructuredText: 'Specify a minimum and/or maximum allowed number of characters'
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
        assetImageDimensions: 'Specify a minimum and/or maximum allowed image dimension'
      };

      // Defines the rich text node validations that appear below the general
      // validations in the 'Validations' tab for the field dialog template.
      const validatedNodeTypes = {
        [INLINES.ENTRY_HYPERLINK]: {
          description: 'Link to entry',
          validations: ['linkContentType']
        },
        [BLOCKS.EMBEDDED_ENTRY]: {
          description: 'Embedded block entry',
          validations: ['linkContentType', 'size']
        },
        [INLINES.EMBEDDED_ENTRY]: {
          description: 'Embedded inline entry',
          validations: ['linkContentType', 'size']
        }
      };

      const nodeValidationLabels = {
        size: 'Limit number of entries',
        linkContentType: 'Accept only specified entry type'
      };

      const nodeValidationHelpText = {
        size: 'Specify a minimum and/or maximum allowed number of entries',
        linkContentType: 'Make this link type only accept entries from specified content type(s)'
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
        'in'
      ];

      const richTextOptionsLabels = {
        [BLOCKS.HEADING_1]: 'heading 1',
        [BLOCKS.HEADING_2]: 'heading 2',
        [BLOCKS.HEADING_3]: 'heading 3',
        [BLOCKS.HEADING_4]: 'heading 4',
        [BLOCKS.HEADING_5]: 'heading 5',
        [BLOCKS.HEADING_6]: 'heading 6',
        [MARKS.BOLD]: 'bold',
        [MARKS.ITALIC]: 'italic',
        [MARKS.UNDERLINE]: 'underline',
        [MARKS.CODE]: 'code',
        [BLOCKS.UL_LIST]: 'unordered list',
        [BLOCKS.OL_LIST]: 'ordered list',
        [BLOCKS.QUOTE]: 'quote',
        [BLOCKS.HR]: 'horizontal rule',
        [BLOCKS.EMBEDDED_ENTRY]: 'block entry',
        [BLOCKS.EMBEDDED_ASSET]: 'block asset',
        [INLINES.EMBEDDED_ENTRY]: 'inline entry',
        [INLINES.HYPERLINK]: 'link to Url',
        [INLINES.ENTRY_HYPERLINK]: 'link to entry',
        [INLINES.ASSET_HYPERLINK]: 'link to asset'
      };

      const schema = createSchema({ type: 'Validation' });

      return {
        decorateFieldValidations,
        decorateNodeValidations,
        extractFieldValidations,
        getExtractedNodesValidation,
        validate,
        validateAll,
        updateField,
        addEnabledRichTextOptions
      };

      /**
       * @ngdoc method
       * @name validationDecorator#decorateFieldValidations
       * @param {Field} field
       * @returns {DecoratedValidation[]}
       */
      function decorateFieldValidations(field) {
        const validationTypes = _.filter(
          validationTypesForField(field),
          t => t in validationSettings
        );

        let fieldValidations = _.map(validationTypes, validationDecorator(field));

        if (field.items) {
          const itemValidations = _.chain(decorateFieldValidations(field.items))
            .reject({ type: 'unique' })
            .map(validation => ({ ...validation, onItems: true }))
            .value();

          fieldValidations = [...itemValidations, ...fieldValidations];
        }

        return _.sortBy(fieldValidations, validation => validationsOrder.indexOf(validation.type));
      }

      /**
       * @ngdoc method
       * @name validationDecorator#decorateNodeValidations
       * @param {Node} nodeTypesWithValidations
       * @returns {DecoratedNodeValidation[]}
       */
      function decorateNodeValidations(nodeTypesWithValidations) {
        const decoratedNodeValidations = [];

        for (const [nodeType, { description, validations }] of _.entries(validatedNodeTypes)) {
          const node = {
            type: nodeType,
            validations: nodeTypesWithValidations[nodeType] || []
          };

          const nodeValidations = _.map(validations, nodeValidationDecorator(node));

          decoratedNodeValidations.push({
            description,
            validations: _.sortBy(nodeValidations, ({ type }) => validationsOrder.indexOf(type))
          });
        }

        return decoratedNodeValidations;
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

      function nodeValidationDecorator(node) {
        return function decorateNodeValidation(type) {
          const nodeValidation = findNodeValidationByType(node.validations, type);
          let settings, enabled, message;

          if (nodeValidation) {
            enabled = true;
            settings = nodeValidation[type];
            message = nodeValidation.message;
          } else {
            enabled = false;
            settings = validationSettings[type];
            message = null;
          }

          const name = getValidationStringForType(nodeValidationLabels, node, type);
          const views = validationViews.get(type);
          const currentView = views && views[0].name;
          const helpText = getValidationStringForType(nodeValidationHelpText, node, type);

          return {
            name,
            helpText,
            type,
            onItems: false,
            enabled,
            message,
            settings: _.cloneDeep(settings),
            views,
            currentView,
            nodeType: node.type
          };
        };
      }

      /**
       * @ngdoc method
       * @name validationDecorator#extractFieldValidations
       * @param {DecoratedValidation[]} decorated
       * @returns {Validation[]}
       */
      function extractFieldValidations(decorated) {
        const enabled = _.filter(
          decorated,
          validation => validation.enabled && validation.type !== 'nodes'
        );

        return _.map(enabled, extractOne);
      }

      /**
       * @ngdoc method
       * @name validationDecorator#getExtractedNodesValidation
       * @param {DecoratedNodeValidation[]} decorated
       * @returns {NodeValidation[]}
       */
      function getExtractedNodesValidation(decorated) {
        return {
          nodes: _.chain(decorated)
            .flatMap('validations')
            .filter('enabled')
            .groupBy('nodeType')
            .mapValues(values => _.map(values, extractOne))
            .value()
        };
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
        const { enabled, type } = validation;
        const errors = enabled ? schema.errors(extractOne(validation)) : [];

        return _.map(errors, error => ({
          ...error,
          path: [],
          message: getErrorMessage(type, error)
        }));
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
      function updateField(field, validations, nodeValidations) {
        const { true: itemValidations, false: baseValidations } = _.groupBy(validations, 'onItems');

        if (nodeValidations) {
          field.validations = [
            ...extractFieldValidations(baseValidations),
            getExtractedNodesValidation(nodeValidations)
          ];
        } else {
          field.validations = extractFieldValidations(baseValidations);
        }

        if (!_.isEmpty(itemValidations)) {
          field.items.validations = extractFieldValidations(itemValidations);
        }
      }

      function addEnabledRichTextOptions(field, options) {
        const { enabledNodeTypes, enabledMarks } = options;

        const validationsCopy = field.validations.filter(
          validation => !(validation.enabledMarks || validation.enabledNodeTypes)
        );

        if (enabledMarks) {
          validationsCopy.push({
            enabledMarks: enabledMarks,
            message: makeMessage('marks', enabledMarks)
          });
        }
        if (enabledNodeTypes) {
          validationsCopy.push({
            enabledNodeTypes: enabledNodeTypes,
            message: makeMessage('nodes', enabledNodeTypes)
          });
        }
        field.validations = validationsCopy;

        function makeMessage (kindPlural, enabledTypes) {
          const list = joinWithAnd(enabledTypes.map(name => richTextOptionsLabels[name]));
          return list.length > 0
            ? `Only ${list} ${kindPlural} are allowed`
            : `${capitalize(kindPlural)} are not allowed`;
        }
      }

      function validateAll(decoratedFieldValidations, decoratedNodeValidations) {
        const decoratedValidations = decoratedNodeValidations
          ? [...decoratedFieldValidations, getExtractedNodesValidation(decoratedNodeValidations)]
          : decoratedFieldValidations;
        return _.reduce(
          decoratedValidations,
          (allErrors, validation, index) => {
            const errors = validate(validation);
            const errorsWithIndex = errors.map(error => ({
              ...error,
              path: [index, error.path]
            }));
            return [...allErrors, ...errorsWithIndex];
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

      function findNodeValidationByType(nodeValidations, name) {
        return _.find(
          nodeValidations,
          nodeValidation => nodeValidationName(nodeValidation) === name
        );
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
