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
   * Default widgets for fields are specified here for display purposes,
   * but actually determined in the widgets service (see docs there
   * for an explanation)
   */
  var fieldTypes = [
    {
      iconId: 'shorttext',
      name: 'Short Text',
      description: 'Email, phone #, URL, slug, color code, opening hours, tags',
      type: 'Symbol',
      hasListVariant: true,
      defaultWidget: {single: 'singleLine', list: 'singleLine'}
    },
    {
      iconId: 'longtext',
      name: 'Long Text',
      description: 'Post title, product description, formatted article, author name',
      type: 'Text',
      defaultWidget: {single: 'markdown'}
    },
    {
      iconId: 'number',
      name: 'Integer',
      description: 'ID, order number, rating, quantity',
      type: 'Integer',
      defaultWidget: {single: 'numberEditor'}
    },
    {
      iconId: 'decimal',
      name: 'Decimal Number',
      description: 'Price, measurement, exchange rate, weight',
      type: 'Number',
      defaultWidget: {single: 'numberEditor'}
    },
    {
      iconId: 'calendar',
      name: 'Date & Time',
      description: 'Creation date, opening hours, promotion period',
      type: 'Date',
      defaultWidget: {single: 'datePicker'}
    },
    {
      iconId: 'location',
      name: 'Location',
      description: 'Map coordinates, company address, venue location',
      type: 'Location',
      defaultWidget: {single: 'locationEditor'}
    },
    {
      iconId: 'media',
      name: 'Media',
      description: 'Photo, PDF brochure, document, attachments, podcast archive, playlist',
      type: 'Asset',
      isLink: true,
      hasListVariant: true,
      defaultWidget: {single: 'assetLinkEditor', list: 'assetLinksEditor'}
    },
    {
      iconId: 'boolean',
      name: 'Boolean',
      description: 'RSVP, membership in a group, availability in stock',
      type: 'Boolean',
      defaultWidget: {single: 'radio'}
    },
    {
      iconId: 'json',
      name: 'JSON Object',
      description: 'External record, template values',
      type: 'Object',
      defaultWidget: {single: 'objectEditor'}
    },
    {
      iconId: 'reference',
      name: 'Reference',
      description: 'Link your Content Types',
      type: 'Entry',
      isLink: true,
      hasListVariant: true,
      defaultWidget: {single: 'entryLinkEditor', list: 'entryLinksEditor'}
    }
  ];

  return {
    all: fieldTypes,
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
