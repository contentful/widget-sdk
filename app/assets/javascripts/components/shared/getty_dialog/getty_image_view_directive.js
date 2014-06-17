'use strict';

angular.module('contentful').directive('gettyImageView', function(){
  return {
    template: JST.getty_image_view(),
    restrict: 'C'
  };
});
