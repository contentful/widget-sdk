'use strict';

angular.module('contentful').directive('cfFieldOrderHeader', function(){
  return {
    template: JST.cf_field_order_header(),
    restrict: 'A',
    link: function (scope, elem, attrs) {
      scope.isDisplayField = attrs.cfFieldOrderHeader == 'displayField';
    }
  };
});
