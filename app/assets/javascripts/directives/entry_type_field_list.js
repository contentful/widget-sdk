'use strict';

angular.module('contentful/directives').directive('entryTypeFieldList', function() {
  return {
    restrict: 'C',
    template: JST.entry_type_field_list(),
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
          ui.item.startIndex = ui.item.index('.existing-field');
        },
        update: function(e, ui) {
          var oldIndex = ui.item.startIndex;
          var newIndex = ui.item.index('.existing-field');
          delete ui.item.startIndex;
          scope.doc.at('fields').move(oldIndex, newIndex, function(err) {
            if (err) {
              // undo DOM move operation
              if (oldIndex < newIndex){
                $(ui.item).insertBefore(body.children('.existing-field').at(oldIndex));
              } else {
                $(ui.item).insertAfter(body.children('.existing-field').at(oldIndex));
              }
            } else {
              scope.$apply('otUpdateEntity()');
            }
          });
        }
      });

      //scope.closeAllValidations =function() {
        //scope.$broadcast('closeAllValidations');
      //};

    },
  };
});
