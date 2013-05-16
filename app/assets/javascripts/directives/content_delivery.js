'use strict';

angular.module('contentful').
  directive('contentDelivery', function() {
    return {
      template: JST.content_delivery(),
      restrict: 'C',
      controller: 'ContentDeliveryCtrl'
    };
  });
