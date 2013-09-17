'use strict';

angular.module('contentful').directive('contentTypeFieldList', function() {
  return {
    restrict: 'C',
    template: JST.content_type_field_list(),
    link: function link(scope, elm) {
      var body = elm.eq(0);
      body.sortable({
        handle: '.drag-handle',
        items: '.cf-field-settings',
        axis: 'y',
        start: function(event, ui) {
          body.sortable('refresh');
          ui.item.startIndex = $('.cf-field-settings', body).index(ui.item);
        },
        update: function(e, ui) {
          var oldIndex = ui.item.startIndex;
          var newIndex = $('.cf-field-settings', body).index(ui.item);
          delete ui.item.startIndex;
          var itemsLength = body.find('.cf-field-settings');
          if(oldIndex < itemsLength || newIndex < itemsLength){
            throw new Error('Sortable attempted to reorder unexisting indexes oldIndex '+oldIndex+' and newIndex'+newIndex);
          }
          scope.otDoc.at('fields').move(oldIndex, newIndex, function(err) {
            if (err) {
              // undo DOM move operation
              if (oldIndex < newIndex){
                $(ui.item).insertBefore(body.children('.cf-field-settings').at(oldIndex));
              } else {
                $(ui.item).insertAfter(body.children('.cf-field-settings').at(oldIndex));
              }
              throw err;
            } else {
              scope.$apply('otUpdateEntity()');
            }
          });
        }
      });

      scope.$watch('otEditable', function (editable) {
        if (editable) {
          body.sortable('enable');
        } else {
          body.sortable('disable');
        }
      });

    },
    controller: 'ContentTypeFieldListCtrl'
  };
});
