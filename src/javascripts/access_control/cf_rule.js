'use strict';

angular.module('contentful').directive('cfRule', [function () {
  return {
    restrict: 'E',
    template: JST['rule'](),
    controller: ['$scope', function ($scope) {
      $scope.$watch('rule.action', function (action) {
        var value = (action === 'edit') ? 'all' : null;
        $scope.rule.locale = value;
        setField(value);
      });

      $scope.$watch('rule.contentType', function (id) {
        var ct = $scope.spaceContext._publishedContentTypesHash[id];
        $scope.contentTypeFields = dotty.get(ct, 'data.fields', []);
        setField('all');
      });

      function setField(value) {
        if ('field' in $scope.rule) {
          $scope.rule.field = value;
        }
      }
    }]
  };
}]);
