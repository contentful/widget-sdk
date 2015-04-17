'use strict';

angular.module('contentful').directive('cfLocaleEditor', function () {
  return {
    template: JST.locale_editor(),
    restrict: 'A',
    controller: 'LocaleEditorController'
  };
});
