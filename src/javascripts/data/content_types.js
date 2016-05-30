'use strict';

angular.module('cf.data')
/**
 * @ngdoc service
 * @module cf.data
 * @name data/ContentTypes
 * @description
 * A collection of helper methods to query, manipulate, and sanitize
 * Content Type data.
 */
.factory('data/ContentTypes', [function () {

  return {
    assureDisplayField: assureDisplayField,
    assureName: assureName,
    internalToPublic: internalToPublic
  };

  /**
   * @ngdoc method
   * @name data/ContentTypes#assureDisplayField
   * @description
   * If the 'name' property on the Content Type data is not set, set it
   * to 'Untitled'.
   *
   * This is required for legacy Content Types. The API requires new Content Types to have a name.
   *
   * @param {API.ContentType} data
   */
  function assureName (contentTypeData) {
    if (!contentTypeData.name) {
      contentTypeData.name = 'Untitled';
    }
  }

  /**
   * @ngdoc method
   * @name data/ContentTypes#assureDisplayField
   * @description
   * Mutate the Content Type data so that the 'displayField' property
   * points to a valid display field.
   *
   * If the display field was set before and valid, it is retained.
   * Otherwise the first suitable field is used.
   *
   * @param {API.ContentType} data
   */
  function assureDisplayField (contentTypeData) {
    contentTypeData.displayField = getDisplayField(contentTypeData);
  }

  /**
   * Returns true if the 'displayField' value of a Content Type points
   * to an existing field in the Content Type and the field type is
   * 'Symbol' or 'Text'
   *
   * @pure
   * @param {API.ContentType} datac
   * @returns {boolean}
   */
  function hasValidDisplayField (contentTypeData) {
    var displayField = contentTypeData.displayField;
    return _.any(contentTypeData.fields, function (field) {
      return displayField === field.id && isDisplayField(field);
    });
  }

  /**
   * If `data.displayField` does not point to an existing field, return
   * the first field usable as a display field. Otherwise returns the display
   * field.
   *
   * @pure
   * @param {API.ContentType} data
   * @returns {string?}
   */
  function getDisplayField (contentTypeData) {
    if (hasValidDisplayField(contentTypeData)) {
      return contentTypeData.displayField;
    } else {
      return findFieldUsableAsTitle(contentTypeData.fields);
    }
  }

  /**
   * Returns the ID of the first field that can be used as the
   * 'displayField'. That is a Symbol or Text fields that are not
   * disabled. Returns undefined if no display field candidate was found.
   *
   * @pure
   * @param {API.Field[]?} fields
   * @returns {string?}
   */
  function findFieldUsableAsTitle (fields) {
    return  _(fields)
      .filter(isDisplayField)
      .pluck('id')
      .first();
  }

  function isDisplayField (field) {
    return _.contains(['Symbol', 'Text'], field.type) && !field.disabled;
  }

  /**
   * @ngdoc method
   * @name data/ContentTypes#internalToPublic
   * @description
   * Return the public representation of a Content Type from the
   * internal one.
   *
   * The internal represenation is that received from the API with the
   * 'X-Contentful-Skip-Transformation' header and the public one is
   * that received without the header.
   *
   * @param {API.ContentType} data
   * @returns {API.ContentTypeExternal}
   */
  function internalToPublic (data) {
    var result = {};

    result.name = data.name;
    result.sys = data.sys;
    result.fields = _.map(data.fields, function (field) {
      var newField = _.assign({}, field);

      newField.id = newField.apiName || newField.id;

      // set displayField id correctly
      if (field.id === data.displayField) {
        result.displayField = field.apiName || field.id;
      }

      delete newField.apiName;

      return newField;
    });

    return result;
  }
}]);
