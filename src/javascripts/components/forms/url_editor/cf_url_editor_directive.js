'use strict';

angular.module('contentful').directive('cfUrlEditor', [function () {
  return {
    restrict: 'E',
    scope: true,
    template: JST.cf_url_editor(),
    controller: 'UrlEditorController'
  };
}]);
