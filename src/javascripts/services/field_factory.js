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
      iconId: 'shorttext',
      name: 'Short Text',
      description: 'Email, phone #, URL, slug, color code, opening hours, tags',
      type: 'Symbol',
      hasListVariant: true,
    },
    {
      iconId: 'longtext',
      name: 'Long Text',
      description: 'Post title, product description, formatted article, author name',
      type: 'Text'
    },
    {
      iconId: 'number',
      name: 'Integer',
      description: 'ID, order number, rating, quantity',
      type: 'Integer'
    },
    {
      iconId: 'decimal',
      name: 'Decimal Number',
      description: 'Price, measurement, exchange rate, weight',
      type: 'Number'
    },
    {
      iconId: 'calendar',
      name: 'Date & Time',
      description: 'Creation date, opening hours, promotion period',
      type: 'Date'
    },
    {
      iconId: 'location',
      name: 'Location',
      description: 'Map coordinates, company address, venue location',
      type: 'Location'
    },
    {
      iconId: 'media',
      name: 'Media',
      description: 'Photo, PDF brochure, document, attachments, podcast archive, playlist',
      type: 'Asset',
      isLink: true,
      hasListVariant: true,
    },
    {
      iconId: 'boolean',
      name: 'Boolean',
      description: 'RSVP, membership in a group, availability in stock',
      type: 'Boolean'
    },
    {
      iconId: 'json',
      name: 'JSON Object',
      description: 'External record, template values',
      type: 'Object'
    },
    {
      iconId: 'reference',
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
    getIconId: getIconId,
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
   * @name fieldFactory#getIconId
   * @description
   * Return an id for the associated field icon
   * @return {string}
  */
  function getIconId(field) {
    return 'field-'+getFieldDescriptor(field).iconId;
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
      throw new Error('The field type "'+type+'" does not have a list variant');

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
