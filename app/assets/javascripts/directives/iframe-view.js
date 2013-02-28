'use strict';

angular.module('contentful/directives').directive('iframeView', function(){
  return {
    template: JST['iframe_view'](),
    restrict: 'C',
    scope: {
      tab: '=',
      bucketContext: '='
    },
  };
});

