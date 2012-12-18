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

            scope.$watch('publishedIds', function(ids, old, scope) {
              if (ids) {
                scope.deletable = !_(ids).contains(scope.field.id);
              }
            });

            scope.$watch('sjDoc', function(sjDoc, old, scope) {
              if (old && old !== sjDoc) {
                scope.field = null;
                old.removeListener(scope.childListener);
                scope.childListener = null;
              }
              if (sjDoc) {
                scope.field = sjDoc.snapshot.fields[scope.index];
                console.log('installing child listener for', scope.index);
                scope.childListener = sjDoc.at([]).on('child op', function(path, op) {
                  if (path[0] === 'fields' && path[1] === scope.index) {
                    //console.log('child op applying at', scope.index, path, op);
                    if (path[2] === 'disabled' || path[2] == 'type') {
                      scope.$apply(function(scope) {
                        scope.field = sjDoc.snapshot.fields[scope.index];
                      });
                    } else if (path.length == 2 && op.ld) {
                      scope.$destroy();
                    }
                  }
                });
              }
            });

            function attachNameField(val, old, scope) {
              //if (old !== val) {
                if (scope.cleanupTextArea){
                  scope.cleanupTextArea();
                  scope.cleanupTextArea = null;
                }
              //}
              if (scope.sjDoc && scope.index !== undefined && scope.index !== null) {
                var nameDoc  = scope.sjDoc.at(['fields', scope.index, 'name']);
                scope.cleanupTextArea = nameDoc.attach_textarea(elm.find('.field-name')[0]);
              }
            }

            scope.$watch('sjDoc', attachNameField);
            scope.$watch('index', attachNameField);

            scope.$watch('field.type', function(type, old, scope) {
              if (type === old) return;
              scope.sjDoc.at(['fields', scope.index, 'type']).set(type, function(err) {
                if (err) scope.$apply(function(scope) {
                    scope.field.type = old;
                  });
              });
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

            scope.delete = function() {
              this.sjDoc.at(['fields', this.index]).remove(function(err) {
                if (!err) scope.$destroy();
              });
            };

            scope.$on('$destroy', function() {
              if (scope.cleanupTextArea) scope.cleanupTextArea();
              elm.remove();
            });

          };
        },
      };
    }
  };

});



