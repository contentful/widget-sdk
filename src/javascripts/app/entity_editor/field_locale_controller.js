'use strict';

angular.module('cf.app')
/**
 * @scope.requires {API.Locale} locale
 * @scope.requires {API.Field} field
 * @scope.requires validationResult
 */
.controller('FieldLocaleController', ['$injector', '$scope', function ($injector, $scope) {
  var controller = this;
  var fieldPath = ['fields', $scope.field.id];
  var localePath = fieldPath.concat([$scope.locale.internal_code]);

  $scope.$watch('validationResult.errors', function (errors) {
    errors = _.filter(errors, function (error) {
      var path = error.path;
      return _.isEqual(path.slice(0, 3), localePath) || _.isEqual(path, fieldPath);
    });
    if (errors.length > 0) {
      controller.errors = errors;
    } else {
      controller.errors = null;
    }
  });
}]);
