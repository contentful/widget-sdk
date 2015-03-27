'use strict';

angular.module('contentful').directive('cfContentTypeEditor', [function(){
  return {
    template: JST.content_type_editor(),
    restrict: 'A',
    controller: 'ContentTypeEditorController',
    controllerAs: 'ctEditorController'
  };
}]);
