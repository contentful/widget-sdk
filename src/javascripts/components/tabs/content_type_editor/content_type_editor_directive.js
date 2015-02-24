'use strict';

angular.module('contentful').directive('cfContentTypeEditor', ['defer', function(defer){
  return {
    template: JST.content_type_editor(),
    restrict: 'A',
    controller: 'ContentTypeEditorController',
    controllerAs: 'ctEditorController',
    link: function (scope, elem) {

      function focus() {
        if (scope.otEditable) {
          var input = elem.find('[name=contentTypeForm] input').eq(0);
          defer(function () { input.focus(); });
          unwatchEditable();
        }
      }
      var unwatchEditable = scope.$watch('otEditable', focus);
    }
  };
}]);
