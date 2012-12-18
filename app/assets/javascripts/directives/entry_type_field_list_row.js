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
                scope.childListener = sjDoc.at(['fields']).on('child op', function(path) {
                  if (path[0] == scope.index){
                    //console.log('child op',path, op);
                    if (path[1] === 'disabled' || path[1] == 'type') {
                      scope.$apply(function(scope) {
                        scope.field = sjDoc.snapshot.fields[scope.index];
                      });
                    }
                  }
                });
              }
            });

            function attachNameField(val, old, scope) {
              if (old !== val) {
                if (scope.cleanupTextArea){
                  scope.cleanupTextArea();
                  scope.cleanupTextArea = null;
                }
              }
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



