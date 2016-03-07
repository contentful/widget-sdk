'use strict';

angular.module('contentful')
/**
 * @ngdoc service
 * @name editingInterfaces/helpers
 * @description
 * TODO Temporary module to avoid circular dependencies. Name is
 * horrible.
 */
.factory('editingInterfaces/helpers', [function () {

  return {
    findField: findField,
    findWidget: findWidget
  };

  /**
   * @ngdoc method
   * @name editingInterfaces/helpers#findField
   * @description
   * Find a field in a content types fields based on the passed in `widget`'s
   * fieldId.  Since we can't be sure that all content types have the `apiName`
   * property in the field, we need to fall back to the `id`.
   *
   * @param {Array<API.Field>} contentTypeFields
   * @param {API.Widget} widget
   * @return {API.Field?}
   */
  function findField(contentTypeFields, widget) {
    // Both widget.fieldId and field.apiName could be undefined due to legacy
    // data. For this reason a comparison between a fieldId that is undefined
    // and a apiName that is undefined would result in true, causing mismatched
    // mapping and a subtle bug.
    if(!_.isString(widget.fieldId)) {
      return;
    }
    return _.find(contentTypeFields, function(field) {
      return field.apiName === widget.fieldId || field.id === widget.fieldId;
    });
  }

  /**
   * @ngdoc method
   * @name editingInterfaces/helpers#findWidget
   * @description
   * Find the widget that uses a given field
   *
   * TODO I think we can use `widgets.field` to compare the ids. The
   * first argument should always pass through the Editing Interface
   * transformer.
   * @param {Array<API.Widget>} widgets
   * @param {API.Field} contentTypeField
   * @return {API.Widget?}
   */
  function findWidget(widgets, field) {
    var fieldId = field.apiName || field.id;
    return _.find(widgets, {fieldId: fieldId});
  }
}]);
