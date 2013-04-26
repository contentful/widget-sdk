'use strict';

angular.module('contentful/directives').
  directive('contentDelivery', function() {
    return {
      template: JST.content_delivery(),
      restrict: 'C',
      controller: 'ContentDeliveryCtrl'
    };
  });
