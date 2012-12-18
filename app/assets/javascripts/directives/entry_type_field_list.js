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

            scope.$on('deleteField', function(event) {
              console.log('delete Field', event);
            });

            function removeRow($row) {
              $row.data('removeListeners')();
              $row.remove();
              updateAllDocPaths();
            }

            function toggleSortable() {
              body.sortable('destroy');
              body.sortable({
                items: '.existing-field',
                handle: '.reorder-handle',
                forcePlaceholderSize: true
              });
            }

            function updateAllDocPaths(){
              $(body.children('.existing-field')).each(function(index, elem) {
                $(elem).data('updateDocPaths')(index);
              });
            }


            function addButtonHandler() {
              var field = {
                id   : $('.new-field .field-id').val(),
                name : $('.new-field .field-name').val(),
                type : $('.new-field .field-type').val()
              };

              var fieldDoc = scope.doc.doc.at(['fields']);
              var index = fieldDoc.get().length;

              fieldDoc.insert(index, field, function(err) {
                if (err) {
                  window.alert('ShareJS says no');
                } else {
                  var row = makeRow(field, index, scope.doc.doc);
                  body.find('.new-field')
                    .find('input, select').val(null).end()
                    .before(row)
                    .find('.field-id').focus();
                  toggleSortable();
                }
              });
            }

            //init
            scope.$watch('doc.doc', function(sjDoc, old, scope) {
              // TODO handle switch
              if (!sjDoc) return;
              var fields = sjDoc.getAt(['fields']);
              var rows = _(fields).map(function(field, index) {
                return '<tr class="existing-field" sj-doc="doc.doc" entry-type-field-list-row="entryType.data.fields['+index+']" available-types="availableTypes" published-ids="publishedIds"/>';
              });
              body.prepend(rows);
              $compile(body)(scope);

              // Moving
              toggleSortable();
              body.on('sortupdate', function(e, ui) {
                sjDoc.at('fields').move(ui.oldIndex, ui.newIndex, function(err) {
                  if (err) {
                    $(ui.item).insertBefore(body.children().at(ui.oldIndex));
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
              return;

              // Deleting
              var deleteListener = sjDoc.at('fields').on('delete', function(position, data) {
                var $row = $(body.find('.existing-field')[position]);
                removeRow($row);
              });

              // Adding
              body.find('.add-button').click(addButtonHandler);
              var addListener = sjDoc.at('fields').on('insert', function(position, field){
                var row = makeRow(field, position, sjDoc);
                var fields = sjDoc.getAt(['fields']);
                if (fields.length === 0) {
                  body.prepend(row);
                } else {
                  var other = $(body.children()[position]);
                  row.insertBefore(other);
                  toggleSortable();
                }
              });

              // TODO remove moveListener, addListener on destruction
              
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


