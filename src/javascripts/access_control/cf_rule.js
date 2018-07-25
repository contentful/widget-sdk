'use strict';

angular.module('contentful')
.directive('cfRule', ['require', require => {
  const spaceContext = require('spaceContext');
  const K = require('utils/kefir');
  const CONFIG = require('PolicyBuilder/CONFIG');

  return {
    restrict: 'E',
    template: JST['rule'](),
    controller: ['$scope', $scope => {
      // prepare content type select options
      K.onValueScope($scope, spaceContext.publishedCTs.items$, cts => {
        $scope.contentTypes = [{
          id: CONFIG.ALL_CTS,
          name: 'All content types'
        }].concat(cts.map(ct => ({
          id: ct.sys.id,
          name: ct.name
        })));
      });

      // when selected action changes...
      $scope.$watch('rule.action', (action, prev) => {
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
      $scope.$watch('rule.contentType', (id, prev) => {
        const ct = spaceContext.publishedCTs.get(id);

        // get fields of selected content type
        $scope.contentTypeFields = _.map(_.get(ct, 'data.fields', []), f => ({
          id: f.apiName || f.id,
          name: f.name
        }));
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
