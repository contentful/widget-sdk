'use strict';

angular.module('contentful').directive('cfFieldSettingsEditor', function() {
  return {
    restrict: 'E',
    template: JST.cf_field_settings_editor(),
    controller: 'FieldSettingsEditorController',
    link: function (scope, elem) {
      var unwatch = scope.$watch('isAccordionItemOpen(field)', function (open) {
        if (open) { elem.find('input[name="fieldName"]').focus(); }
      });

      function clickHandler() {
        if (!scope.isAccordionItemOpen(scope.field)) scope.toggleAccordionItem(scope.field);
      }

      scope.$on('$destroy', function () {
        unwatch();
        unwatch = null;
        elem.off('click', clickHandler);
      });
    }
  };
});
