'use strict';

angular.module('contentful').directive('cfLocaleList', function() {
    return {
      template: JST['locale_list'](),
      restrict: 'A',
      controller: 'LocaleListController'
    };
  });
