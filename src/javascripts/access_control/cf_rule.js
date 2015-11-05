'use strict';

angular.module('contentful').directive('cfRule', [function () {
  return {
    restrict: 'E',
    template: JST['rule'](),
    controller: ['$scope', function ($scope) {

      // when selected action changes...
      $scope.$watch('rule.action', function (action) {
        // ...to "edit" -> reset locale and field
        if (action === 'edit') {
          setFieldAndLocale('all');
        }
        // ...to "create" -> reset scope, remove locale and field
        else if (action === 'create') {
          $scope.rule.scope = 'any';
          setFieldAndLocale(null);
        }
        // otherwise -> remove locale and field
        else { setFieldAndLocale(null); }
      });

      // when selected content type is changed
      $scope.$watch('rule.contentType', function (id) {
        var ct = $scope.spaceContext._publishedContentTypesHash[id];
        // get fields of selected content type
        $scope.contentTypeFields = dotty.get(ct, 'data.fields', []);
        // reset selected field to default one
        if (ct) { setField('all'); }
      });

      function setFieldAndLocale(field, locale) {
        setField(field);
        $scope.rule.locale = locale || field || null;
      }

      // this sets field involved in a rule (only if rule can hold field)
      function setField(field) {
        if ('field' in $scope.rule) {
          $scope.rule.field = field || null;
        }
      }
    }]
  };
}]);
