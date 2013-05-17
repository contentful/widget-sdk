angular.module('contentful').controller('IframeViewCtrl', function ($scope) {
  'use strict';

  $scope.$on('iframeMessage', function (event, data) {
    console.log('iframe message', event, data);
  });
  
});
