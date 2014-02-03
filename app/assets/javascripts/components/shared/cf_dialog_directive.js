'use strict';

angular.module('contentful').directive('cfDialog', function (modalDialog) {
  return {
    restrict: 'CA',
    link: function (scope, elem, attrs) {
      elem.on('click', function () {
        scope.dialog = modalDialog.open({
          title: attrs.dialogTitle || null,
          template: attrs.dialogTemplate,
          scope: scope
        });
      });

      scope.$on('$destroy', modalDialog.close);
    }
  };
});
