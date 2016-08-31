'use strict';

angular.module('contentful')
.directive('bindHtmlCompile', ['$compile', function ($compile) {
  return {
    restrict: 'A',
    link: function (scope, el, attrs) {
      scope.$watch(function () {
        return scope.$eval(attrs.bindHtmlCompile);
      }, function (value) {
        // In case value is a TrustedValueHolderType, sometimes it
        // needs to be explicitly called with `toString` in order
        // to get the HTML string.
        el.html(value && value.toString());
        $compile(el.contents())(scope);
      });
    }
  };
}]);
