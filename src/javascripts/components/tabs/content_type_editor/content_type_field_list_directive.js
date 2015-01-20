'use strict';

angular.module('contentful').directive('contentTypeFieldList', function() {
  return {
    restrict: 'C',
    template: JST.content_type_field_list(),
    controller: 'ContentTypeFieldListController',
    link: function link(scope) {
      scope.fieldListSortOptions = {
        handle: '.drag-handle',
        items: '.cf-field-settings-editor',
        axis: 'y',
        start: function() {
          scope.$apply('preferences.showDisabledFields = true');
        },
        update: function(e, ui) {
          var oldIndex = ui.item.sortable.index;
          var newIndex = ui.item.sortable.dropindex;
          scope.otDoc.at('fields').move(oldIndex, newIndex, function() {
            scope.$apply('otUpdateEntity()');
          });
        }
      };

      scope.$watch('otEditable', function (editable) {
        scope.fieldListSortOptions.disabled = !editable;
      });

    }
  };
});
