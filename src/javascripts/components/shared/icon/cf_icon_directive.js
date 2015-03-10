'use strict';

angular.module('contentful').directive('cfIcon', ['$compile', 'prefixAssetHostFilter', function($compile, prefixAssetHostFilter){
  return {
    restrict: 'E',
    link: function (scope, el, attrs) {
      var imagePath = prefixAssetHostFilter('/app/images/contentful_icons.svg');
      el.html(
        '<object class="cf-icon" type="image/svg+xml" data="'+
        imagePath +'#'+ attrs.name +'"></object>'
      );
    }
  };
}]);
