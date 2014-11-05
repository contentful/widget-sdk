'use strict';

angular.module('contentful').directive('contentTypeEditor', ['defer', function(defer){
  return {
    template: JST.content_type_editor(),
    restrict: 'C',
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
