'use strict';

angular.module('contentful').directive('cfContentTypeEditor', ['$timeout', function ($timeout){
  return {
    template: JST.content_type_editor(),
    restrict: 'A',
    controller: 'ContentTypeEditorController',
    controllerAs: 'ctEditorController',
    link: function (scope, element) {
      var fieldList = element.find('[ng-model="contentType.data.fields"]');
      var scrollContainer = fieldList.scrollParent();
      scope.$on('fieldAdded', function () {
        // The new field must be added to the list to calculate the
        // correct scroll position
        $timeout(function () {
          var height = fieldList.height();
          scrollContainer.scrollTop(height);
        });
      });
    }
  };
}]);
