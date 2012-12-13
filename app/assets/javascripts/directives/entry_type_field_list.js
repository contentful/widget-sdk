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
              var row = fieldTemplate.clone()
                .find('.field-id').val(field.id).end()
                .find('.field-name').val(field.name).end()
                .find('.field-type').val(field.type).end();
              doc.at(['fields', index, 'name']).attach_textarea(row.find('.field-name')[0]);
              doc.at(['fields', index, 'type']).attach_textarea(row.find('.field-type')[0]);
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
                  }
                });
              });
              var moveListener = doc.at('fields').on('move', function(from, to){
                console.log('moving', from, to);
                var item = $(body.children()[from]);
                var other = $(body.children()[to]);
                console.log('moving', item.find('.field-name').val(), other.find('.field-name').val());
                if (from < to) {
                  item.insertAfter(other);
                } else {
                  item.insertBefore(other);
                }
              });

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


