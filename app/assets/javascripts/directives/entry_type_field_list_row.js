define([
  'templates/entry_type_field_list_row',
  'lodash',
  'jquery',
], function(template, _, $){
  'use strict';

  return {
    name: 'entryTypeFieldListRow',
    factory: function() {
      return {
        restrict: 'A',
        //template: template(),
        //replace: true,
        scope: {
          sjDoc: '=',
          initialField: '=entryTypeFieldListRow',
          availableTypes: '=' //TODO Later the available types have to come from the validation library
        },
        compile: function(elem) {
          // custom compilation because templates appparently can't carry TR tags
          var templateNode = $(template());
          elem.html(templateNode.contents());

          return function linkEntryTypeFieldListRow(scope, elm) {
            scope.deletable = true;
            scope.field = scope.initialField;
            //after init link field to snapShot
            scope.index = elm.index();

            scope.$watch('sjDoc', function linkName(sjDoc, old, scope) {
              if (old && old !== sjDoc) {
                scope.cleanupTextArea();
                scope.cleanupTextArea = null;
                scope.nameDoc = null;
              }
              if (sjDoc) {
                scope.nameDoc  = sjDoc.at(['fields', scope.index, 'name']);
                scope.cleanupTextArea = scope.nameDoc.attach_textarea(elm.find('.field-name')[0]);
              }
            });

          };
        },
      };
    }
  };

});



