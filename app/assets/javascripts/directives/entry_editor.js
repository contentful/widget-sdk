'use strict';

angular.module('contentful').directive('entryEditor', function(){
  return {
    template: JST.entry_editor(),
    restrict: 'C',
    controller: 'EntryEditorCtrl',
    link: function (scope, elem) {
      function focus() {
        if (scope.fields && scope.otEditable) {
          var input = elem.find('[name=entryForm]').find('input, textarea').eq(0);
          _.defer(function () { input.focus(); });
          unwatchFields();
          unwatchEditable();
        }
      }
      var unwatchFields = scope.$watch('fields', focus);
      var unwatchEditable = scope.$watch('otEditable', focus);
    }
  };
});
