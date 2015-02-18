'use strict';

angular.module('contentful').directive('cfContentTypeList', function(){
  return {
    template: JST.content_type_list(),
    restrict: 'A',
    controller: 'ContentTypeListController'
  };
});
