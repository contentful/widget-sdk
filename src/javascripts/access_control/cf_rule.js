'use strict';

angular.module('contentful').directive('cfRule', ['$injector', function ($injector) {

  var CONFIG = $injector.get('PolicyBuilder/CONFIG');

  return {
    restrict: 'E',
    template: JST['rule'](),
    controller: ['$scope', function ($scope) {

      // prepare content type select options
      $scope.$watch('spaceContext.publishedContentTypes', function (cts) {
        $scope.contentTypes = _.map(cts, function (ct) {
          return { id: ct.getId(), name: ct.data.name };
        });
        $scope.contentTypes.unshift({ id: CONFIG.ALL_CTS, name: 'All content types' });
      });

      // when selected action changes...
      $scope.$watch('rule.action', function (action, prev) {
        // ...for the first time -> do nothing
        if (action === prev) {
          /* eslint no-empty: off */
        } else if (action === 'update') {
          // ...to "edit" -> reset locale and field
          setDefaultFieldAndLocale();
        } else if (action === 'create') {
          // ...to "create" -> reset scope, remove locale and field
          $scope.rule.scope = 'any';
          removeFieldAndLocale();
        } else {
          // otherwise -> remove locale and field
          removeFieldAndLocale();
        }
      });

      // when selected content type is changed
      $scope.$watch('rule.contentType', function (id, prev) {
        var ct = $scope.spaceContext.getPublishedContentType(id);

        // get fields of selected content type
        $scope.contentTypeFields = _.map(dotty.get(ct, 'data.fields', []), function (f) {
          return { id: f.apiName || f.id, name: f.name };
        });
        $scope.contentTypeFields.unshift({ id: CONFIG.ALL_FIELDS, name: 'All fields' });

        // reset selected field to default one
        if (id !== prev) { setDefaultField(); }
      });

      function setDefaultFieldAndLocale () {
        setDefaultField();
        setLocale(CONFIG.ALL_LOCALES);
      }

      function removeFieldAndLocale () {
        setField(null);
        setLocale(null);
      }

      function setDefaultField () {
        setField(CONFIG.ALL_FIELDS);
      }

      // this sets field involved in a rule (only if rule can hold field)
      function setField (field) {
        if ('field' in $scope.rule) {
          $scope.rule.field = field || null;
        }
      }

      // the same for locale
      function setLocale (locale) {
        if ('locale' in $scope.rule) {
          $scope.rule.locale = locale || null;
        }
      }
    }]
  };
}]);
