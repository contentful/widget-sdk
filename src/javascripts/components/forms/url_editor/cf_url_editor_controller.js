'use strict';

angular.module('contentful').controller('UrlEditorController', [
  '$scope', '$injector', function ($scope, $injector) {

  var urlUtils = $injector.get('urlUtils');

  $scope.$watch('fieldData.value', updateState);

  /**
   * @param {string}
   */
  function updateState(value) {
    if (value && !urlUtils.isValid(value)) {
      $scope.state = 'invalid';
    } else {
      delete $scope.state;
    }
  }
}]);
