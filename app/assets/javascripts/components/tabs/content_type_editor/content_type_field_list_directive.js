'use strict';

angular.module('contentful').directive('contentTypeFieldList', function() {
  return {
    restrict: 'C',
    template: JST.content_type_field_list(),
    link: function link(scope, elm) {
      var body = elm.find('tbody').eq(0);
      body.sortable({
        handle: '.drag-handle',
        items: '.existing-field',
        forceHelperSize: true,
        start: function(event, ui) {
          scope.$apply(function(scope) {
            scope.closeAllValidations();
          });
          body.sortable('refresh');
          ui.item.startIndex = $('.existing-field', body).index(ui.item);
        },
        update: function(e, ui) {
          var oldIndex = ui.item.startIndex;
          var newIndex = $('.existing-field', body).index(ui.item);
          delete ui.item.startIndex;
          var itemsLength = body.find('.existing-field');
          if(oldIndex < itemsLength || newIndex < itemsLength){
            throw new Error('Sortable attempted to reorder unexisting indexes oldIndex '+oldIndex+' and newIndex'+newIndex);
          }
          scope.otDoc.at('fields').move(oldIndex, newIndex, function(err) {
            if (err) {
              // undo DOM move operation
              if (oldIndex < newIndex){
                $(ui.item).insertBefore(body.children('.existing-field').at(oldIndex));
              } else {
                $(ui.item).insertAfter(body.children('.existing-field').at(oldIndex));
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
