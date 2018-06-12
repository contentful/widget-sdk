'use strict';

angular.module('contentful')

/**
 * @ngdoc directive
 * @name uiOnScroll
 * @usage
 *   h('.scroll-container', {uiOnScroll: 'scroll-event'}, [
 *     // ...
 *   ])
 *
 * @description
 * Elements with this directive emit an event on the scope when the
 * element content is scrolled. The attribute value determines the
 * event name. The event parameter is the value of the elements
 * `scrollTop` property.
 * ~~~js
 * $scope.$on('scrollEvent', (_ev, scrollTop) => {
 *   console.log('scrollTop', scrollTop)
 * })
 * ~~~
 */
.directive('uiOnScroll', [() => ({
  restrict: 'A',

  link: function ($scope, $elem, $attrs) {
    $elem.on('scroll', listener);
    $scope.$on('$destroy', () => {
      $elem.off('scroll', listener);
    });

    function listener () {
      $scope.$emit($attrs.uiOnScroll, $elem.get(0).scrollTop);
    }
  }
})]);
