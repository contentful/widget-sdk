'use strict';

angular.module('contentful').directive('contentModel', ['$injector', function($injector) {
  var contentModelFieldTypes = $injector.get('contentModelFieldTypes');
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

      scope.getHelpText = function (type) {
        var fieldType = contentModelFieldTypes[type];
        if(!fieldType) throw new Error('No type for '+type);
        return '<p>'+fieldType.description +'</p><p><strong>JSON Primitive:</strong> '+fieldType.jsonType+'</p>';
      };
    }
  };
}]);
