'use strict';

angular.module('contentful').directive('cfContentTypeEditor', ['$timeout', function($timeout){
  return {
    template: JST.content_type_editor(),
    restrict: 'A',
    controller: 'ContentTypeEditorController',
    controllerAs: 'ctEditorController',
    link: function (scope, elem) {
      var input = elem.find('[name=contentTypeForm] input').eq(0);
      $timeout(function () {
        input.focus();
      }, 750);
    }
  };
}]);
