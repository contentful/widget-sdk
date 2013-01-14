'use strict';

angular.module('contentful/directives').directive('entryTypeFieldListRow', function() {
  return {
    restrict: 'A',
    //template: template(),
    //replace: true,
    scope: {
      doc: '=',
      initialField: '=entryTypeFieldListRow',
      publishedIds: '=',
      availableTypes: '='
    },
    compile: function(elem) {
      // custom compilation because templates appparently can't carry TR tags
      var templateNode = $(JST.entry_type_field_list_row());
      elem.html(templateNode.contents());

      return function linkEntryTypeFieldListRow(scope, elm, attrs) {
        scope.index = elm.index();
        scope.published = true;
        scope.field = _.clone(scope.initialField);

        scope.$on('orderChanged', function(event) {
          event.currentScope.$apply(function(scope) {
            scope.index = elm.index();
          });
        });

        scope.$watch('publishedIds', function(ids, old, scope) {
          if (ids) {
            scope.published = _.contains(ids, scope.field.id);
          }
        });

        scope.$watch('doc', function(doc, old, scope) {
          if (old && old !== doc) {
            scope.field = null;
            old.removeListener(scope.childListener);
            scope.childListener = null;
          }
          if (doc) {
            scope.field = doc.snapshot.fields[scope.index];
            scope.childListener = doc.at([]).on('child op', function(path, op) {
              if (path[0] === 'fields' && path[1] === scope.index) {
                //console.log('child op applying at', scope.index, path, op);
                if (path[2] === 'disabled' || path[2] == 'type') {
                  scope.$apply(function(scope) {
                    scope.field = doc.snapshot.fields[scope.index];
                  });
                } else if (path.length == 2 && op.ld) {
                  scope.$destroy();
                }
              }
            });
          }
        });
        scope.$watch('index', function(index, old, scope) {
          if (scope.doc) {
            scope.field = scope.doc.snapshot.fields[scope.index];
          } // else will be initialized in the doc Watcher
        });

        function attachNameField(val, old, scope) {
          //if (old !== val) {
            if (scope.cleanupTextArea){
              scope.cleanupTextArea();
              scope.cleanupTextArea = null;
            }
          //}
          if (scope.doc && scope.index !== undefined && scope.index !== null) {
            var nameDoc  = scope.doc.at(['fields', scope.index, 'name']);
            scope.cleanupTextArea = nameDoc.attach_textarea(elm.find('.field-name')[0]);
          }
        }

        scope.$watch('doc', attachNameField);
        scope.$watch('index', attachNameField);

        scope.$watch('field.type', function(type, old, scope) {
          if (type === old) return;
          scope.doc.at(['fields', scope.index, 'type']).set(type, function(err) {
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
          this.doc.at(['fields', this.index, 'disabled']).set(false, function(err) {
            if (!err) scope.$apply(function(scope) {
                scope.field.disabled = false;
              });
          });
        };
        scope.disable = function() {
          this.doc.at(['fields', this.index, 'disabled']).set(true, function(err) {
            if (!err) scope.$apply(function(scope) {
                scope.field.disabled = true;
              });
          });
        };

        scope.delete = function() {
          this.doc.at(['fields', this.index]).remove(function(err) {
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
});
