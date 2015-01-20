'use strict';

angular.module('contentful').directive('entryEditor', ['defer', function(defer){
  return {
    template: JST.entry_editor(),
    restrict: 'C',
    controller: 'EntryEditorController',
    link: function (scope, elem) {
      function focus() {
        if (scope.fields && scope.otEditable) {
          var input = elem.find('[name=entryForm]').find('input, textarea').eq(0);
          defer(function () { input.focus(); });
          unwatchFields();
          unwatchEditable();
        }
      }
      var unwatchFields = scope.$watch('fields', focus);
      var unwatchEditable = scope.$watch('otEditable', focus);
    }
  };
}]);
