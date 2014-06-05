'use strict';

angular.module('contentful').directive('gettyImageResults', function(){
  return {
    template: JST.getty_image_results(),
    restrict: 'C'
  };
});
