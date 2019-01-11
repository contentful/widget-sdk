import { registerFactory } from 'NgRegistry.es6';
import _ from 'lodash';

/**
 * @ngdoc service
 * @module cf.data
 * @name data/ContentTypes
 * @description
 * A collection of helper methods to query, manipulate, and sanitize
 * Content Type data.
 */
registerFactory('data/ContentTypes', () => {
  return { assureDisplayField };

  /**
   * @ngdoc method
   * @name data/ContentTypes#assureDisplayField
   * @description
   * Mutate the Content Type data so that the 'displayField' property
   * points to a valid display field.
   * @param {API.ContentType} ctData
   */
  function assureDisplayField(ctData) {
    const validDisplayField = getDisplayField(ctData);

    if (typeof validDisplayField === 'string') {
      // If the display field was set before and is valid, it is retained.
      // Otherwise the first valid field is used.
      ctData.displayField = validDisplayField;
    } else if (typeof ctData.displayField === 'string') {
      // If there was no valid display field found but the content type
      // defines one - set it to `undefined`.
      // If the content type defines one that is not a string (e.g. `null`)
      // we don't do anything so the editor won't enter dirty state.
      ctData.displayField = undefined;
    }
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
  function hasValidDisplayField(contentTypeData) {
    const displayField = contentTypeData.displayField;
    return _.some(
      contentTypeData.fields,
      field => displayField === field.id && isDisplayField(field)
    );
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
  function getDisplayField(contentTypeData) {
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
  function findFieldUsableAsTitle(fields) {
    return _(fields)
      .filter(isDisplayField)
      .map('id')
      .first();
  }

  function isDisplayField(field) {
    return _.includes(['Symbol', 'Text'], field.type) && !field.disabled;
  }
});
