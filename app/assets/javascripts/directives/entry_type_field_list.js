define([
  'templates/entry_type_field_list',
  'lodash',
  'jquery',

  'jquery.sortable'
], function(template, _, $){
  'use strict';

  return {
    name: 'entryTypeFieldList',
    factory: function() {
      return {
        restrict: 'E',
        template: template(),
        replace: true,
        compile: function(tElement) {
          _(tElement.context.classList).each(function(klass) { tElement.addClass(klass); });
          return function link(scope, elm) {

            var fieldTemplate = elm.find('.existing-field').remove();
            var body = elm.find('tbody');

            function makeRow(field, index, sjDoc){
              var row,
                  fieldDoc, nameDoc, typeDoc,
                  shareJSListeners;
              row = fieldTemplate.clone()
                .find('.field-id').val(field.id).end()
                .find('.field-name').val(field.name).end()
                .find('.field-type').val(field.type).end();
              fieldDoc = sjDoc.at(['fields', index]);
              nameDoc  = sjDoc.at(['fields', index, 'name']);
              typeDoc  = sjDoc.at(['fields', index, 'type']);

              shareJSListeners = nameDoc.attach_textarea(row.find('.field-name')[0]);

              shareJSListeners.push(fieldDoc.on('replace', function fieldDocReplaceHandler(position, was, now) {
                if (position === 'type') {
                  row.find('.field-type').val(now);
                }
              }));

              //TODO: Make this toggleable for when the published version loading is slower than the shareJs connection creation
              //      OR execute the init stuff only after the callback from getPublishedVersion has returned (hard to detect)
              console.log('checking if field published', scope.publishedEntryType);
              if (fieldPublished(field.id)){
                row.find('.field-type').attr({disabled: true});
                row.find('.delete-button').remove(); //TODO Replace by "hide" instead of remove
              } else {
                row.find('.field-type').change(function fieldTypeChangeHandler(event) {
                  var value = $(event.currentTarget).val();
                  typeDoc.set(value, function(err) {
                    if (err) {
                      $(event.currentTarget).val(typeDoc.get());
                    }
                  });
                });

                row.find('.delete-button').click(function() {
                  fieldDoc.remove(function(err) {
                    if (!err) {
                      removeRow(row);
                    }
                  });
                });
              }

              //TODO When the row is removed from DOM, kill the ShareJS handlers
              row.data({
                removeListeners: function() {
                  _(shareJSListeners).each(function(l) {
                    sjDoc.removeListener(l);
                  });
                },
                updateDocPaths: function(index) {
                  fieldDoc.path[1] = index;
                  nameDoc.path[1]  = index;
                  typeDoc.path[1]  = index;
                }
              });

              return row;
            }

            function fieldPublished(fieldId) {
              try {
                return _(scope.publishedEntryType.data.fields).any(function(field) {
                  return field.id == fieldId;
                });
              } catch(e) {
                return false;
              }
            }

            // TODO insertAt function

            function removeRow($row) {
              $row.data('removeListeners')();
              $row.remove();
              updateAllDocPaths();
            }

            function toggleSortable() {
              elm.find('tbody').sortable('destroy');
              elm.find('tbody').sortable({
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

            scope.$watch('availableTypes', function updateSelectOptions(types) {
              var options = _(types).map(function(type) {
                return '<option value="'+type.value+'">'+type.name+'</option>';
              }).join();
              body.find('select').empty().append(options);
              fieldTemplate.find('select').empty().append(options);
            });

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
              var rows = _(fields).map(function(field, index) { return makeRow(field, index, sjDoc); });
              body.prepend(rows);

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


