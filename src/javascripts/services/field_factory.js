'use strict';

/**
 * @ngdoc service
 * @name fieldFactory
 * @description
 * Utilities for creating and handling Content Type Fields
 */
angular.module('contentful').factory('fieldFactory', [
  'require',
  require => {
    const capitalize = require('utils/StringUtils.es6').capitalize;
    const TheLocaleStore = require('TheLocaleStore');

    /**
     * @ngdoc property
     * @name fieldFactory#types
     * @type {Array<FieldDescriptor>}
     * @description
     * List of descriptors for all available fields types.
     *
     * If the `label` and `icon` properties of a descriptor are not set,
     * they will be auto-generated.
     */
    const fieldTypes = [
      {
        name: 'Symbol',
        hasListVariant: true,
        label: 'Short text',
        listLabel: 'Short text, list'
      },
      {
        name: 'Text',
        label: 'Long text'
      },
      {
        name: 'StructuredText',
        label: 'Structured text',
        icon: 'longtext'
      },
      {
        name: 'Integer',
        icon: 'number'
      },
      {
        name: 'Number',
        label: 'Decimal number',
        icon: 'decimal'
      },
      {
        name: 'Date',
        label: 'Date & time',
        icon: 'calendar'
      },
      {
        name: 'Location'
      },
      {
        name: 'Asset',
        isLink: true,
        hasListVariant: true,
        label: 'Media',
        listLabel: 'Media, many files'
      },
      {
        name: 'Boolean'
      },
      {
        name: 'Object',
        label: 'JSON object',
        icon: 'json'
      },
      {
        name: 'Entry',
        isLink: true,
        hasListVariant: true,
        label: 'Reference',
        listLabel: 'References, many'
      }
    ].map(fieldType => {
      const label = fieldType.label || fieldType.name;
      const icon = label.replace(/\s/g, '').toLowerCase();
      return { label, icon, ...fieldType };
    });

    const fieldGroups = [
      {
        name: 'text',
        icon: 'longtext',
        description: 'Titles, names, paragraphs, list of names',
        types: ['Symbol', 'Text']
      },
      {
        name: 'structured-text',
        icon: 'structuredtext',
        label: 'Structured text',
        description: 'Long form articles, documentation, news articles',
        types: ['StructuredText']
      },
      {
        name: 'number',
        description: 'ID, order number, rating, quantity',
        types: ['Integer', 'Number']
      },
      {
        name: 'date-time',
        icon: 'calendar',
        label: 'Date and time',
        description: 'Event date, opening hours',
        types: ['Date']
      },
      {
        name: 'location',
        description: 'Coordinates: latitude and longitude',
        types: ['Location']
      },
      {
        name: 'media',
        description: 'Images, videos, PDFs and other files',
        types: ['Asset']
      },
      {
        name: 'boolean',
        description: 'Yes or no, 1 or 0, true or false',
        types: ['Boolean']
      },
      {
        name: 'json',
        label: 'JSON object',
        description: 'Data in JSON format',
        types: ['Object']
      },
      {
        name: 'reference',
        description: 'For example, a blog post can reference its author(s)',
        types: ['Entry']
      }
    ].map(group => {
      const types = group.types.map(getTypeByName);
      const label = capitalize(group.name);
      const icon = types[0].icon;
      return { label, icon, ...group, types };
    });

    function getTypeByName(name) {
      const type = _.find(fieldTypes, { name: name });
      if (!type) {
        throw new Error(`Could not find field type "${name}"`);
      }
      return type;
    }

    return {
      types: fieldTypes,
      groups: fieldGroups,
      getLabel: getFieldLabel,
      getIconId,
      createTypeInfo,
      getTypeName,
      getLocaleCodes
    };

    /**
     * @ngdoc method
     * @name fieldFactory#getLabel
     * @description
     * Return a human readable label of a Content Type Field.
     *
     * @param {API.ContentType.Field} field
     * @return {string}
     */
    function getFieldLabel(field) {
      const descriptor = getFieldDescriptor(field);
      return descriptor.isList ? descriptor.listLabel : descriptor.label;
    }

    /**
     * @ngdoc method
     * @name fieldFactory#getIconId
     * @description
     * Return an id for the associated field icon
     * @param {API.ContentType.Field} field
     * @return {string}
     */
    function getIconId(field) {
      return `field-${getFieldDescriptor(field).icon}`;
    }

    /**
     * @ngdoc method
     * @name fieldFactory#createTypeInfo
     * @description
     * Create an object that can extend a `Field` with type information
     *
     * @param {FieldDescriptor} descriptor
     * @param {boolean}         isList
     * @return {FieldTypeInfo}
     */
    function createTypeInfo(descriptor, isList) {
      const type = descriptor.name;
      let info = { type };
      if (descriptor.isLink) {
        info.type = 'Link';
        info.linkType = type;
      }
      if (isList && descriptor.hasListVariant) {
        info = { type: 'Array', items: info };
      }
      return info;
    }

    /**
     * @ngdoc method
     * @name fieldFactory#getTypeName
     * @description
     * Returns a string identifier for a type object.
     *
     * We use this string as a simplified reference to field types.
     * Possible values are
     *
     * - Symbol
     * - Symbols
     * - Text
     * - Integer
     * - Number
     * - Boolean
     * - Date
     * - Location
     * - Object
     * - Entry
     * - Entries
     * - Asset
     * - Assets
     *
     * @param {API.ContentType.Field} field
     * @return {string}
     */
    function getTypeName(field) {
      const type = field.type;
      if (type === 'Link') {
        return field.linkType;
      } else if (type === 'Array') {
        const itemsType = _.get(field, 'items.type');
        if (itemsType === 'Link') {
          const linkType = _.get(field, 'items.linkType');
          if (linkType === 'Entry') {
            return 'Entries';
          }
          if (linkType === 'Asset') {
            return 'Assets';
          }
        } else if (itemsType === 'Symbol') {
          return 'Symbols';
        }
      } else {
        return type;
      }
    }

    /**
     * @ngdoc method
     * @name fieldFactory#getLocaleCodes
     * @description
     * Returns a list of internal locale codes that this field stores.
     *
     * If the field is localized it returns the list of all CMA locales.
     * If the field is not localized it returns a list containing only
     * the default locale.
     *
     * @param {API.ContentType.Field} field
     * @return {Array<string>}
     */
    function getLocaleCodes(field) {
      let locales = field.localized
        ? TheLocaleStore.getPrivateLocales()
        : [TheLocaleStore.getDefaultLocale()];
      return _.map(locales, 'internal_code');
    }

    /**
     * @param {API.ContentType.Field} field
     * @return {FieldDescriptor}
     */
    function getFieldDescriptor(field) {
      let type = field.type;
      let linkType = field.linkType;
      const isList = type === 'Array';

      if (isList) {
        type = field.items.type;
        linkType = field.items.linkType;
      }
      if (type === 'Link') {
        type = linkType;
      }
      const descriptor = _.find(fieldTypes, { name: type });
      if (!descriptor) {
        throw new Error(`Unknown field type "${type}"`);
      }
      return { isList, ...descriptor };
    }
  }
]);
