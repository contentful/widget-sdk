'use strict';

/**
 * @ngdoc service
 * @name fieldFactory
 * @description
 * Utilities for creating and handling Content Type Fields
 */
angular.module('contentful')
.factory('fieldFactory', [function () {
  /**
   * @ngdoc property
   * @name fieldFactory#all
   * @description
   * List of descriptors for all available fields.
   */
  var fieldTypes = [
    {
      name: 'Short Text',
      description: 'Single field or list. Good for titles, URLs, tags, etc.',
      type: 'Symbol',
      hasListVariant: true,
    },
    {
      name: 'Long Text',
      description: 'Good for long paragraphs',
      type: 'Text'
    },
    {
      name: 'Integer',
      description: 'Good for whole numbers',
      type: 'Integer'
    },
    {
      name: 'Decimal Number',
      description: 'Good for prices, weights, …',
      type: 'Number'
    },
    {
      name: 'Date & Time',
      description: 'Good for dates or dates and time',
      type: 'Date'
    },
    {
      name: 'Location',
      description: 'Good for addresses and coordinates',
      type: 'Location'
    },
    {
      name: 'Media',
      description: 'Good for images, videos, PDFs, Word files, etc',
      type: 'Asset',
      isLink: true,
      hasListVariant: true,
    },
    {
      name: 'Boolean',
      description: 'Good for simple Yes/No flags',
      type: 'Boolean'
    },
    {
      name: 'JSON Object',
      description: 'Good for JSON snippets',
      type: 'Object'
    },
    {
      name: 'Reference',
      description: 'Link your Content Types',
      type: 'Entry',
      isLink: true,
      hasListVariant: true,
    }
  ];

  return {
    all: fieldTypes,
    getLabel: getFieldLabel,
    createTypeInfo: createTypeInfo,
  };

  /**
   * @ngdoc method
   * @name fieldFactory#getLabel
   * @description
   * Return a human readable label of a Content Type Field.
   * @return {string}
   */
  function getFieldLabel (field) {
    var descriptor = getFieldDescriptor(field);
    var label = descriptor.name;
    if (descriptor.isList)
      label += ' List';

    return label;
  }

  /**
   * @ngdoc method
   * @name fieldFactory#createTypeInfo
   * @description
   * Create an object that can extend a `Field` with type information
   * @param {string} type
   * @param {boolean} isList
   * @return {FieldTypeInfo}
   */
  function createTypeInfo (type, isList) {
    var descriptor = _.find(fieldTypes, {type: type});
    if (!descriptor)
      throw new Error('Unknown field type');

    var info = { type: type };
    if (descriptor.isLink) {
      info.type = 'Link';
      info.linkType = type;
    }

    if (isList && !descriptor.hasListVariant)
      throw new Error('The field type "'+type+'" does not have a list variatn');

    if (isList) {
      info = { type: 'Array', items: info};
    }

    return info;
  }

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

    var descriptor = _.find(fieldTypes, {type: type});
    if (!descriptor)
      throw new Error('Unknown field type');

    return _.extend({isList: isArray}, descriptor);
  }

}]);
