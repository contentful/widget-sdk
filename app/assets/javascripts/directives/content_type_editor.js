'use strict';

angular.module('contentful').directive('contentTypeEditor', function(){
  return {
    template: JST.content_type_editor(),
    restrict: 'C',
    controller: 'ContentTypeEditorCtrl',
    link: function (scope, elem) {
      
      function focus() {
        if (scope.otEditable) {
          var input = elem.find('[name=contentTypeForm] input').eq(0);
          _.defer(function () { input.focus(); });
          unwatchEditable();
        }
      }
      var unwatchEditable = scope.$watch('otEditable', focus);
    }
  };
});
