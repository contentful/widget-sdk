angular.module('cf.ui')

/*
 * @ngdoc directive
 * @name cfLoader
 * @description
 * This directive will insert a loader that can be controlled by the parent
 * It optionally activates on state change events if configured to do so using
 * the `watch-state-change` boolean attribute.
 * The `is-shown` attribute accepts a property from the parent scope. The loader
 * is toggled based on this property.
 * The `loader-msg` attribute can be used to configure a custom loading message.
 *
 * @usage[jade]
 * div
 *   header
 *   cf-loader(is-shown="isLoading", watch-state-change="true", loader-msg="Loading...")
 *
 * cf-loader(watch-state-change="true") //- this adds only a state change loader
 * cf-loader(loader-msg="Please wait...")
 * cf-loader(is-shown="isLoading")
 * cf-loader(is-shown="somePropFromParentScope", loader-msg="Loading xyz...")
 */
.directive('cfLoader', function () {
  var template = '';

  template += '<div class="loader" ng-show=isShown role="progressbar" aria-busy="{{ isShown }}" aria-label="loader-interstitial">';
  template += '  <div class="loader__container">';
  template += '    <div class="loader__spinner"></div>';
  template += '    <div class="loader__message">{{ loaderMsg }}</div>';
  template += '  </div>';
  template += '</div>';

  return {
    restrict: 'E',
    scope: {
      isShown: '=?',
      loaderMsg: '@',
      watchStateChange: '@'
    },
    template: template,
    controller: ['$scope', 'require', function ($scope, require) {
      var $rootScope = require('$rootScope');
      var $parse = require('$parse');

      $scope.watchStateChange = $parse($scope.watchStateChange)();
      $scope.loaderMsg = $scope.loaderMsg || 'Please hold on...';

      if ($scope.watchStateChange) {
        $rootScope.$on('$stateChangeStart', showLoader);
        $rootScope.$on('$stateChangeSuccess', hideLoader);
        $rootScope.$on('$stateChangeCancel', hideLoader);
        $rootScope.$on('$stateNotFound', hideLoader);
        $rootScope.$on('$stateChangeError', hideLoader);
      }

      function showLoader () {
        $scope.isShown = true;
      }

      function hideLoader () {
        $scope.isShown = false;
      }
    }]
  };
})
/*
 * @ngdoc directive
 * @name cfInlineLoader
 * @description
 * This directive inserts an inline loader.
 *
 * The `is-shown` attribute accepts a property from the parent scope. The loader
 * is toggled based on this property.
 *
 * @usage[jade]
 * .search
 *   input(type="text")
 *   cf-inline-loader(is-shown="isSearching")
 */
.directive('cfInlineLoader', function () {
  return {
    restrict: 'E',
    scope: {
      isShown: '='
    },
    template:
      '<div ng-show=isShown class="loader loader--inline" aria-label="loader-inline" role="progressbar" aria-busy="{{ isShown }}">' +
        '<span class="loader__spinner--inline"></span>' +
      '</div>'
  };
});
