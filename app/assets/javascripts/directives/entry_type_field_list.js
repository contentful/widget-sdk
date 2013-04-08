'use strict';

angular.module('contentful/directives').directive('entryTypeFieldList', function($compile, toIdentifier) {
  return {
    restrict: 'C',
    template: JST.entry_type_field_list(),
    link: function link(scope, elm) {
      var defaultType = scope.availableTypes[0];
      scope.newType = defaultType.value;
      var body = elm.find('tbody').eq(0);
      body.sortable({
        handle: '.drag-handle',
        items: '.existing-field',
        start: function(event, ui) {
          scope.$apply(function(scope) {
            scope.closeAllValidations();
          });
          body.sortable('refresh');
          ui.item.startIndex = ui.item.index('.existing-field');
        },
        update: function(e, ui) {
          var oldIndex = ui.item.startIndex;
          var newIndex = ui.item.index('.existing-field');
          delete ui.item.startIndex;
          scope.doc.at('fields').move(oldIndex, newIndex, function(err) {
            if (err) {
              if (oldIndex < newIndex){
                $(ui.item).insertBefore(body.children('.existing-field').at(oldIndex));
              } else {
                $(ui.item).insertAfter(body.children('.existing-field').at(oldIndex));
              }
            } else {
              updateAllDocPaths();
            }
          });
        }
      });

      scope.closeAllValidations =function() {
        scope.$broadcast('closeAllValidations');
      };

      scope.$watch('publishedEntryType', function(et, old, scope) {
        if (et && et.data.fields)
          scope.publishedIds = _.pluck(et.data.fields, 'id');
      });
      scope.$on('published', function(event) {
        event.currentScope.$apply(function(scope) {
          scope.publishedIds = _.pluck(scope.publishedEntryType.data.fields, 'id');
        });
      });

      function refreshSortable() {
        body.sortable('refresh');
      }

      function updateAllDocPaths(){
        scope.$broadcast('orderChanged');
      }

      function makeRow(index) {
        return '<tr class="existing-field" doc="doc" entry-type-field-list-row="fieldSnapshot('+index+')" available-types="availableTypes" published-ids="publishedIds"/>';
      }

      scope.addField = function() {
        var scope = this;
        var field = {
          id   : scope.newId,
          name : scope.newName,
          required: scope.newRequired,
          localized: scope.newLocalized
        };
        _.extend(field, scope.newType);

        var fieldDoc = scope.doc.at(['fields']);
        var index = fieldDoc.get().length;

        fieldDoc.insert(index, field, function(err) {
          if (err) {
            window.alert('ShareJS says no');
          } else {
            var row = makeRow(index);
            scope.$apply(function(scope) {
              row = $compile(row)(scope);
              body.append(row);
              scope.newId = scope.newName = null;;
              scope.newType = defaultType.value;
            });
            scope.$broadcast('orderChanged');
            body.find('.field-id').focus();
            refreshSortable();
          }
        });
      };

      scope.fieldSnapshot = function(index) {
        return this.doc.getAt(['fields', index]);
      };

      scope.$watch('newName', function(name, previousName) {
        if (scope.newId &&
            previousName &&
            scope.newId !== toIdentifier(previousName))
          return;
        scope.newId = name ? toIdentifier(name) : '';
      });

      //init
      scope.$watch('doc', function(doc, old, scope) {
        if (!doc) return;
        var fields = doc.getAt(['fields']);
        var rows = _.map(fields, function(field, index) {
          return makeRow(index);
        });
        body.prepend(rows);
        $compile(body)(scope);

        // Adding
        var addListener = doc.at('fields').on('insert', function(position){
          var row = makeRow(position);
          scope.$apply(function(scope) {
            scope.closeAllValidations();
            row = $compile(row)(scope);
            var fields = doc.getAt(['fields']);
            if (fields.length === 0 || fields.length-1 === position) {
              body.append(row);
            } else {
              var other = $(body.children('.existing-field')[position]);
              other.before(row);
            }
          });
          refreshSortable();
          updateAllDocPaths();
        });

        // Moving
        var moveListener = doc.at('fields').on('move', function(from, to){
          //console.log('moving', from, to);
          scope.closeAllValidations();
          var item = $(body.children('.existing-field')[from]);
          var other = $(body.children('.existing-field')[to]);
          //console.log('moving', item.find('.field-name').val(), other.find('.field-name').val());
          if (from < to) {
            item.insertAfter(other);
          } else {
            item.insertBefore(other);
          }
          refreshSortable();
          updateAllDocPaths();
        });

        // For debugging ShareJS Operations
        //sjDoc.at('fields').on('child op', function(path, op) {
          //console.log('child op', path, op);
        //});
        //sjDoc.on('remoteop', function(path, op) {
          //console.log('child op', path, op);
        //});
      });

    },
  };
});
