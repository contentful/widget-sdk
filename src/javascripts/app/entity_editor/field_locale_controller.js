'use strict';

angular.module('cf.app')
/**
 * @ngdoc type
 * @name FieldLocaleController
 * @description
 * Exposes field locale specific data.
 *
 * The controller is scoped to a specific locale of a specific field
 *
 * @scope.requires {API.Locale} locale
 * @scope.requires {API.Field} field
 * @scope.requires validationResult
 * @scope.requires docPresence
 */
.controller('FieldLocaleController', ['$injector', '$scope', function ($injector, $scope) {
  var controller = this;
  var fieldPath = ['fields', $scope.field.id];
  var localePath = fieldPath.concat([$scope.locale.internal_code]);

  /**
   * @ngdoc property
   * @name FieldLocaleController#errors
   * @type {Array<Error>?}
   */
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

  /**
   * @ngdoc property
   * @name FieldLocaleController#collaborators
   * @type {API.User[]}
   * @description
   * A list of users that are also editing this field locale.
   */
  $scope.$watch(function () {
    return dotty.get($scope, ['otPresence', 'fields', localePath.join('.'), 'users']);
  }, function (collaborators) {
    controller.collaborators = collaborators;
  });

  /**
   * @ngdoc method
   * @name FieldLocaleController#announcePresence
   * @description
   * Tells the main document that the user is currently editing this
   * field locale.
   */
  controller.announcePresence = function () {
    $scope.docPresence.focus(localePath.join('.'));
  };
}]);
