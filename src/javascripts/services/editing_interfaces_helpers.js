'use strict';

angular.module('contentful')
/**
 * @ngdoc service
 * @name editingInterfaces/helpers
 * @description
 * TODO Temporary module to avoid circular dependencies. Name is
 * horrible.
 */
.factory('editingInterfaces/helpers', [() => {
  return {
    findWidget: findWidget
  };
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
  function findWidget (widgets, field) {
    var fieldId = field.apiName || field.id;
    return _.find(widgets, {fieldId: fieldId});
  }
}]);
