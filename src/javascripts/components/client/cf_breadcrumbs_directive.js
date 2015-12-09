'use strict';

/**
 * @ngdoc directive
 * @name cfBreadcrumbs
 *
 * @property {boolean} topState  Is true if there is only one
 * breadcrumb. This breadcrumb is associated to the current page.
 */
angular.module('contentful').directive('cfBreadcrumbs', ['$injector', function ($injector) {
  var $breadcrumb = $injector.get('$breadcrumb');
  var $state      = $injector.get('$state');

  return {
    template: JST.cf_breadcrumbs(),
    restrict: 'E',
    replace: true,
    link: function ($scope, element) {
      var debounce = $injector.get('debounce'),
          breadcrumbsContainer = element.find('.breadcrumbs-container'),
          arrowLeft = element.find('.breadcrumbs-arrow.left'),
          arrowRight = element.find('.breadcrumbs-arrow.right'),
          debouncedScrollToLastBreadCrumb = debounce(scrollToLastBreadcrumb, 100);

      function scrollToLastBreadcrumb() {
        var crumbs = breadcrumbsContainer.find('li'),
            lastCrumb;

        // Get last breadcrumb and scroll to it.
        if (crumbs.length) {
          lastCrumb = crumbs.last();
          breadcrumbsContainer.animate({ scrollLeft: lastCrumb[0].offsetLeft + lastCrumb.width() });
        }
        updateArrows();
      }
      arrowLeft.hide();
      arrowRight.hide();

      function canScroll() {
        return {
          left: breadcrumbsContainer[0].scrollLeft !== 0,
          right: (breadcrumbsContainer[0].offsetWidth + Math.round(breadcrumbsContainer[0].scrollLeft)) !== breadcrumbsContainer[0].scrollWidth
        };
      }

      // Watch scrollability with jQuery instead of angular's digest cycle
      function updateArrows() {
        if (canScroll().left) { arrowLeft.show(); } else { arrowLeft.hide(); }
        if (canScroll().right) { arrowRight.show(); } else { arrowRight.hide(); }
      }

      function updateTopState() {
        $scope.topState = $breadcrumb.getStatesChain().length === 1;
      }

      breadcrumbsContainer.scroll(updateArrows);
      updateTopState();
      $scope.$on('$stateChangeSuccess', debouncedScrollToLastBreadCrumb);
      $scope.$on('$stateChangeSuccess', updateTopState);
      $scope.$watch(function () { return $state.current.ncyBreadcrumbLabel; }, debouncedScrollToLastBreadCrumb);

      $scope.scrollLeft = function () {
        breadcrumbsContainer.animate({ scrollLeft: breadcrumbsContainer.scrollLeft() - breadcrumbsContainer.width() });
      };
      $scope.scrollRight = function () {
        breadcrumbsContainer.animate({ scrollLeft: breadcrumbsContainer.scrollLeft() + breadcrumbsContainer.width() });
      };
    }
  };
}]);
