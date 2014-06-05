'use strict';

angular.module('contentful').directive('gettySearchArea', function(){
  return {
    template: JST.getty_search_area(),
    restrict: 'C'
  };
});
