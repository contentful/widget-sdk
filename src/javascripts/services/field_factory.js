'use strict';

/**
 * @ngdoc service
 * @name fieldFactory
 * @description
 * Utilities for creating and handling Content Type Fields
 */
angular.module('contentful')
.factory('fieldFactory', ['stringUtils', function (stringUtils) {
  var capitalize = stringUtils.capitalize;
  /**
   * @ngdoc property
   * @name fieldFactory#types
   * @type {Array<TypeDescriptor>}
   * @description
   * List of descriptors for all available fields types.
   *
   * If the `label` and `icon` properties of a descriptor are not set,
   * they will be auto-generated.
   *
   * Default widgets for fields are specified here for display purposes,
   * but actually determined in the widgets service (see docs there
   * for an explanation)
   */
  var fieldTypes = _.forEach([
    {
      name: 'Symbol',
      hasListVariant: true,
      label: 'Short Text',
      listLabel: 'Short Text, list',
      defaultWidget: {single: 'singleLine', list: 'singleLine'}
    },
    {
      name: 'Text',
      label: 'Long Text',
      defaultWidget: {single: 'markdown'},
    },
    {
      name: 'Integer',
      defaultWidget: {single: 'numberEditor'},
      icon: 'number',
    },
    {
      name: 'Number',
      label: 'Decimal Number',
      defaultWidget: {single: 'numberEditor'},
      icon: 'decimal',
    },
    {
      name: 'Date',
      label: 'Date & Time',
      defaultWidget: {single: 'datePicker'},
      icon: 'calendar',
    },
    {
      name: 'Location',
      defaultWidget: {single: 'locationEditor'},
    },
    {
      name: 'Asset',
      isLink: true,
      hasListVariant: true,
      label: 'Media',
      listLabel: 'Media, many files',
      defaultWidget: {single: 'assetLinkEditor', list: 'assetLinksEditor'},
    },
    {
      name: 'Boolean',
      defaultWidget: {single: 'radio'},
    },
    {
      name: 'Object',
      label: 'JSON Object',
      defaultWidget: {single: 'objectEditor'},
      icon: 'json',
    },
    {
      name: 'Entry',
      isLink: true,
      hasListVariant: true,
      label: 'Reference',
      listLabel: 'References, many',
      defaultWidget: {single: 'entryLinkEditor', list: 'entryLinksEditor'},
    }
  ], function (descriptor) {
    _.defaults(descriptor, {
      label: descriptor.name
    });
    _.defaults(descriptor, {
      icon: descriptor.label.replace(/ +/g, '').toLowerCase(),
    });
  });

  var fieldGroups = _.forEach([{
    name: 'text',
    icon: 'longtext',
    description: 'Titles, names, paragraphs, list of names',
    types: [ 'Symbol', 'Text' ]
  }, {
    name: 'number',
    description: 'ID, order number, rating, quantity',
    types: [ 'Integer', 'Number' ]
  }, {
    name: 'date-time',
    icon: 'calendar',
    label: 'Date and time',
    description: 'Event date, opening hours',
    types: ['Date']
  }, {
    name: 'location',
    description: 'Coordinates: latitude and longitude',
    types: ['Location']
  }, {
    name: 'media',
    description: 'Images, videos, PDFs and other files',
    types: ['Asset']
  }, {
    name: 'boolean',
    description: 'Yes or no, 1 or 0, true or false',
    types: ['Boolean']
  }, {
    name: 'json',
    label: 'JSON Object',
    description: 'Data in JSON format',
    types: ['Object']
  }, {
    name: 'reference',
    description: 'For example, a blog post can reference its author(s)',
    types: ['Entry']
  }], function (group) {
    group.types = _.map(group.types, getTypeByName);
    _.defaults(group, {
      label: capitalize(group.name),
      icon: group.types[0].icon
    });
  });

  function getTypeByName(name) {
    var type = _.find(fieldTypes, {name: name});
    if (!type)
      throw new Error('Could not find field type "'+name+'"');
    return type;
  }

  return {
    types: fieldTypes,
    groups: fieldGroups,
    getLabel: getFieldLabel,
    getIconId: getIconId,
    getDefaultWidget: getDefaultWidget,
    createTypeInfo: createTypeInfo,
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
  function getFieldLabel (field) {
    var descriptor = getFieldDescriptor(field);
    if (descriptor.isList)
      return descriptor.listLabel;
    else
      return descriptor.label;
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
    return 'field-'+getFieldDescriptor(field).icon;
  }

  /**
   * @ngdoc method
   * @name fieldFactory#getDefaultWidget
   * @description
   * Returns the default widget for a given field
   * @return {string}
   */
  function getDefaultWidget(field) {
    var descriptor = getFieldDescriptor(field);
    return descriptor.isList ? descriptor.defaultWidget.list : descriptor.defaultWidget.single;
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
  function createTypeInfo (descriptor, isList) {
    var type = descriptor.name;
    var info = { type: type };
    if (descriptor.isLink) {
      info.type = 'Link';
      info.linkType = type;
    }

    if (isList && !descriptor.hasListVariant)
      throw new Error('The field type "'+type+'" does not have a list variant');

    if (isList) {
      info = { type: 'Array', items: info};
    }

    return info;
  }

  /**
   * @param {API.ContentType.Field} field
   * @return {FieldDescriptor}
   */
  function getFieldDescriptor (field) {
    var type = field.type;
    var linkType = field.linkType;

    var isArray = type === 'Array';
    if (isArray) {
      type = field.items.type;
      linkType = field.items.linkType;
    }

    var isLink = type === 'Link';
    if (isLink) {
      type = linkType;
    }

    var descriptor = _.find(fieldTypes, {name: type});
    if (!descriptor)
      throw new Error('Unknown field type "'+type+'"');

    return _.extend({isList: isArray}, descriptor);
  }

}]);
