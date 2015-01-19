'use strict';

angular.module('contentful').directive('contentTypeList', function(){
  return {
    template: JST.content_type_list(),
    restrict: 'C',
    controller: 'ContentTypeListController'
  };
});
