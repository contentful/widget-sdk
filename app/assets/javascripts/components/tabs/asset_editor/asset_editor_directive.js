'use strict';

angular.module('contentful').directive('assetEditor', function(defer){
  return {
    template: JST.asset_editor(),
    restrict: 'C',
    controller: 'AssetEditorCtrl',
    link: function (scope, elem) {
      function focus() {
        if (scope.fields && scope.otEditable) {
          var input = elem.find('[name=assetForm]').find('input, textarea').eq(0);
          defer(function () { input.focus(); });
          unwatchFields();
          unwatchEditable();
        }
      }
      var unwatchFields = scope.$watch('fields', focus);
      var unwatchEditable = scope.$watch('otEditable', focus);
    }
  };
});
