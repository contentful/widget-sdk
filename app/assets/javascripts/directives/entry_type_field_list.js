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

            function makeRow(field, index, doc){
              var row,
                  fieldDoc, nameDoc, typeDoc,
                  shareJSListeners;
              row = fieldTemplate.clone()
                .find('.field-id').val(field.id).end()
                .find('.field-name').val(field.name).end()
                .find('.field-type').val(field.type).end();
              fieldDoc = doc.at(['fields', index]);
              nameDoc  = doc.at(['fields', index, 'name']);
              typeDoc  = doc.at(['fields', index, 'type']);

              shareJSListeners = nameDoc.attach_textarea(row.find('.field-name')[0]);
              row.find('.field-type').change(function fieldTypeChangeHandler(event) {
                var value = $(event.currentTarget).val();
                typeDoc.set(value, function(err) {
                  if (err) {
                    $(event.currentTarget).val(typeDoc.get());
                  }
                });
              });
              shareJSListeners.push(fieldDoc.on('replace', function fieldDocReplaceHandler(position, was, now) {
                if (position === 'type') {
                  row.find('.field-type').val(now);
                }
              }));

              //TODO When the row is removed from DOM, kill the ShareJS handlers
              row.data({
                shareJSListeners: shareJSListeners,
                updateDocPaths: function(index) {
                  fieldDoc.path[1] = index;
                  nameDoc.path[1]  = index;
                  typeDoc.path[1]  = index;
                }
              });
              return row;
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

            //init
            scope.$watch('doc.doc', function(doc, old, scope) {
              // TODO handle switch
              if (!doc) return;
              var fields = doc.getAt(['fields']);
              var rows = _(fields).map(function(field, index) { return makeRow(field, index, doc); });
              body.prepend(rows);

              // Moving
              toggleSortable();
              body.on('sortupdate', function(e, ui) {
                doc.at('fields').move(ui.oldIndex, ui.newIndex, function(err) {
                  if (err) {
                    $(ui.item).insertBefore(body.children().at(ui.oldIndex));
                  } else {
                    updateAllDocPaths();
                  }
                });
              });
              var moveListener = doc.at('fields').on('move', function(from, to){
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
              //doc.at('fields').on('child op', function(path, op) {
                //console.log('child op', path, op);
              //});

              // Deleting

              // Adding

              // Type Change
            });

          };
        },
      };
    }
  };

});


