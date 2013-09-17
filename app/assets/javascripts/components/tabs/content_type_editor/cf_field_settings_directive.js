angular.module('contentful').directive('cfFieldSettings', function() {
  'use strict';

  return {
    restrict: 'C',
    template: JST['cf_field_settings'](),
    controller: 'CfFieldSettingsCtrl',
    link: function (scope, elem) {
      //elem.on('click', clickHandler);

      var unwatch = scope.$watch('isFieldOpen(field)', function (open) {
        if (open) { elem.find('input[name="fieldName"]').focus(); }
      });

      function clickHandler() {
        if (!scope.isFieldOpen(scope.field)) scope.toggleField(scope.field);
      }

      scope.$on('$destroy', function () {
        unwatch();
        unwatch = null;
        elem.off('click', clickHandler);
      });
    }
  };
});
