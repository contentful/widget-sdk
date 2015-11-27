'use strict';

angular.module('contentful').directive('cfRule', [function () {
  return {
    restrict: 'E',
    template: JST['rule'](),
    controller: ['$scope', function ($scope) {

      // prepare content type select options
      $scope.$watch('spaceContext.publishedContentTypes', function (cts) {
        $scope.contentTypes = _.map(cts, function (ct) {
          return { id: ct.getId(), name: ct.data.name };
        });
        $scope.contentTypes.unshift({ id: 'all', name: 'All content types' });
      });

      // when selected action changes...
      $scope.$watch('rule.action', function (action, prev) {
        // ...for the first time -> do nothing
        if (action === prev) {}
        // ...to "edit" -> reset locale and field
        else if (action === 'update') {
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
      $scope.$watch('rule.contentType', function (id, prev) {
        var ct = $scope.spaceContext._publishedContentTypesHash[id];

        // get fields of selected content type
        $scope.contentTypeFields = _.map(dotty.get(ct, 'data.fields', []), function (f) {
          return { id: f.apiName || f.id, name: f.name };
        });
        $scope.contentTypeFields.unshift({ id: 'all', name: 'All fields' });

        // reset selected field to default one
        if (id !== prev) { setField('all'); }
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
