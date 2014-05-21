'use strict';

angular.module('contentful').directive('gettyMetadata', function(){
  return {
    template: JST.getty_metadata(),
    restrict: 'C',
    scope: {
      image: '=image',
      full: '=full'
    },
    link: function (scope, elem, attrs) {
      if(!_.isUndefined(attrs.full)){
        scope.fullMetadata = true;
      }
    }
  };
});
