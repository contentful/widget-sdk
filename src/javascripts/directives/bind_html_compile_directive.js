'use strict';

angular.module('contentful')
.directive('bindHtmlCompile', ['$compile', $compile => ({
  restrict: 'A',

  link: function (scope, el, attrs) {
    scope.$watch(() => scope.$eval(attrs.bindHtmlCompile), value => {
      // In case value is a TrustedValueHolderType, sometimes it
      // needs to be explicitly called with `toString` in order
      // to get the HTML string.
      el.html(value && value.toString());
      $compile(el.contents())(scope);
    });
  }
})]);
