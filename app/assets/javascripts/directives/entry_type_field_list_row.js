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
            scope.index = elm.index();
            scope.deletable = true;
            scope.field = _(scope.initialField).clone();

            scope.$watch('sjDoc', function(sjDoc, old, scope) {
              if (old && old !== sjDoc) {
                scope.field = null;
              }
              if (sjDoc) {
                scope.field = sjDoc.snapshot.fields[scope.index];
              }
            });

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

            scope.$watch('sjDoc', function linkType(sjDoc, old, scope) {
              if (old && old !== sjDoc) {
                scope.typeWatcher();
                scope.typeWatcher = null;
                old.removeListener(scope.typeListener);
                scope.typeListener = null;
              }
              if (sjDoc){
                scope.typeWatcher = scope.$watch('field.type', function(type, old, scope) {
                  sjDoc.at(['fields', scope.index, 'type']).set(type, function(err) {
                    if (err) scope.$apply(function(scope) {
                        scope.field.type = old;
                      });
                  });
                });
                scope.fieldDoc = sjDoc.at(['fields', scope.index]);
                scope.typeListener = scope.fieldDoc.on('replace', function(position, was, now) {
                  if (position === 'type') scope.$apply(function(scope) {
                      scope.field.type = now;
                    });
                });
              }
            });

          };
        },
      };
    }
  };

});



