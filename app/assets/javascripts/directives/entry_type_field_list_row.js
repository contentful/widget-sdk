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
          publishedIds: '=',
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

            // TODO entweder die ShareJS ops selbst verarbeiten oder auf
            // den snapshot binden

            scope.$watch('publishedIds', function(ids, old, scope) {
              if (ids)
                scope.deletable = !_(ids).contains(scope.field.id);
            });

            scope.$watch('sjDoc', function(sjDoc, old, scope) {
              if (old && old !== sjDoc) {
                scope.field = null;
                //old.removeListener(scope.childListener);
                //scope.childListener = null;
              }
              if (sjDoc) {
                scope.field = sjDoc.snapshot.fields[scope.index];
                //scope.childListener = sjDoc.at(['fields', scope.index]).on('child op', function(path, op) {
                  //console.log('child op',path, op);
                //});
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
                  if (type === old) return;
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

            scope.$watch('index', function linkIndex(index, old, scope) {
              if (scope.nameDoc ) scope.nameDoc.path[1]  = index;
              if (scope.fieldDoc) scope.fieldDoc.path[1] = index;
            });

            scope.enable = function() {
              this.sjDoc.at(['fields', this.index, 'disabled']).set(false, function(err) {
                if (!err) scope.$apply(function(scope) {
                    scope.field.disabled = false;
                  });
              });
            };
            scope.disable = function() {
              this.sjDoc.at(['fields', this.index, 'disabled']).set(true, function(err) {
                if (!err) scope.$apply(function(scope) {
                    scope.field.disabled = true;
                  });
              });
            };
            scope.$watch('fieldDoc', function(fieldDoc, old, scope) {
              if (old && old !== fieldDoc) {
                old.removeListener(scope.disabledListener);
                scope.disabledListener = null;
              }
              if (fieldDoc) {
                scope.disabledListener = fieldDoc.on('replace', function(position, was, now){
                  if (position === 'disabled') scope.$apply(function(scope) {
                      scope.field.disabled = now;
                    });
                });
              }
            });

            scope.delete = function() {
              var event = this.$emit('deleteField');
              //if (!event.defaultPrevented) {
                //this.$destroy();
                //elm.remove();
              //}
            };

            //scope.on('$destroy', function() {
              //scope.cleanupTextArea();
              //scope.sjDoc.removeListener(scope.typeListener);
            //});

          };
        },
      };
    }
  };

});



