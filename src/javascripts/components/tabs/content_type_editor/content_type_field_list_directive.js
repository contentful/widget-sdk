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
        }
      };
    }
  };
});
