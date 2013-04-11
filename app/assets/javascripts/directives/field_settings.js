angular.module('contentful/directives').directive('fieldSettings', function() {
  'use strict';

  return {
    restrict: 'C',
    template: JST['field_settings'](),
    controller: 'FieldSettingsCtrl',

    link: function linkFieldSettings(scope, elm) {

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
    },
  };
});
