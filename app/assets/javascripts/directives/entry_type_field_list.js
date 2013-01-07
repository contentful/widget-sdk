define([
  'templates/entry_type_field_list',
  'lodash',
  'jquery',

  'jquery.sortable'
], function(template, _, $){
  'use strict';

  return {
    name: 'entryTypeFieldList',
    factory: function($compile) {
      return {
        restrict: 'E',
        template: template(),
        replace: true,
        compile: function(tElement) {
          _(tElement.context.classList).each(function(klass) { tElement.addClass(klass); });
          return function link(scope, elm) {
            scope.newType = 'text';
            var body = elm.find('tbody');

            scope.$watch('publishedEntryType', function(et, old, scope) {
              if (et && et.data.fields)
                scope.publishedIds = _(et.data.fields).pluck('id');
            });
            scope.$on('published', function(event) {
              event.currentScope.$apply(function(scope) {
                scope.publishedIds = _(scope.publishedEntryType.data.fields).pluck('id');
              });
            });

            function toggleSortable() {
              body.sortable('destroy');
              body.sortable({
                items: '.existing-field',
                handle: '.reorder-handle',
                forcePlaceholderSize: true
              });
            }

            function updateAllDocPaths(){
              scope.$broadcast('orderChanged');
            }

            function makeRow(index) {
              return '<tr class="existing-field" sj-doc="doc.doc" entry-type-field-list-row="fieldSnapshot('+index+')" available-types="availableTypes" published-ids="publishedIds"/>';
            }

            scope.addField = function() {
              var scope = this;
              var field = {
                id   : scope.newId,
                name : scope.newName,
                type : scope.newType
              };

              var fieldDoc = scope.doc.doc.at(['fields']);
              var index = fieldDoc.get().length;

              fieldDoc.insert(index, field, function(err) {
                if (err) {
                  window.alert('ShareJS says no');
                } else {
                  var row = makeRow(index);
                  scope.$apply(function(scope) {
                    row = $compile(row)(scope);
                    body.append(row);
                    scope.newId = scope.newName = scope.newType = null;
                  });
                  scope.$broadcast('orderChanged');
                  body.find('.field-id').focus();
                  toggleSortable();
                }
              });
            };

            scope.fieldSnapshot = function(index) {
              return this.doc.doc.getAt(['fields', index]);
            };

            //init
            scope.$watch('doc.doc', function(sjDoc, old, scope) {
              if (!sjDoc) return;
              var fields = sjDoc.getAt(['fields']);
              var rows = _(fields).map(function(field, index) {
                return '<tr class="existing-field" sj-doc="doc.doc" entry-type-field-list-row="fieldSnapshot('+index+')" available-types="availableTypes" published-ids="publishedIds"/>';
              });
              body.prepend(rows);
              $compile(body)(scope);

              // Adding
              var addListener = sjDoc.at('fields').on('insert', function(position){
                var row = makeRow(position);
                scope.$apply(function(scope) {
                  row = $compile(row)(scope);
                  var fields = sjDoc.getAt(['fields']);
                  if (fields.length === 0 || fields.length-1 === position) {
                    body.append(row);
                  } else {
                    var other = $(body.children()[position]);
                    other.before(row);
                  }
                });
                toggleSortable();
                updateAllDocPaths();
              });

              // Moving
              toggleSortable();
              body.on('sortupdate', function(e, ui) {
                sjDoc.at('fields').move(ui.oldIndex, ui.newIndex, function(err) {
                  if (err) {
                    if (ui.oldIndex < ui.newIndex){
                      $(ui.item).insertBefore(body.children().at(ui.oldIndex));
                    } else {
                      $(ui.item).insertAfter(body.children().at(ui.oldIndex));
                    }
                  } else {
                    updateAllDocPaths();
                  }
                });
              });
              var moveListener = sjDoc.at('fields').on('move', function(from, to){
                //console.log('moving', from, to);
                var item = $(body.children()[from]);
                var other = $(body.children()[to]);
                //console.log('moving', item.find('.field-name').val(), other.find('.field-name').val());
                if (from < to) {
                  item.insertAfter(other);
                } else {
                  item.insertBefore(other);
                }
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

          };
        },
      };
    }
  };

});


