angular.module('contentful/directives').directive('entryTypeFieldSettings', function() {
  // TODO rename "fieldSettings"
  'use strict';

  return {
    restrict: 'C',
    template: JST['entry_type_field_settings'](),
    controller: 'EntryTypeFieldSettingsCtrl',

    link: function linkEntryTypeFieldSettings(scope, elm) {

      function attachNameField(val, old, scope) {
        if (scope.detachNameField){
          scope.detachNameField();
          scope.detachNameField = null;
        }
        if (scope.doc && scope.index !== undefined && scope.index !== null) {
          var nameDoc  = scope.doc.at(['fields', scope.index, 'name']);
          scope.detachNameField = nameDoc.attach_textarea(elm.find('.name input')[0]);
        }
      }

      scope.$watch('doc', attachNameField);
      scope.$watch('index', attachNameField);

      scope.$on('$destroy', function() {
        if (scope.detachNameField) scope.detachNameField();
      });

      scope.$on('closeAllValidations', function() {
        scope.showValidations = false;
      });

      scope.toggleValidations = function() {
        scope.showValidations = !scope.showValidations;
      };

    },
  };
});
