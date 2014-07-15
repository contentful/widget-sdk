'use strict';

angular.module('contentful').directive('contentModel', function() {
  return {
    template: JST['content_model'](),
    controller: 'ContentTypeListCtrl',
    restrict: 'C',
    link: function (scope) {
      scope.searchTerm = null;

      var expandedContentTypes = {};

      scope.toggleDisplay = function (id) {
        expandedContentTypes[id] = !expandedContentTypes[id];
      };

      scope.isExpanded = function (id) {
        return expandedContentTypes[id];
      };
    }
  };
});
