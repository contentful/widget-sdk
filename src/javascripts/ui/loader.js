angular.module('cf.ui')
.directive('cfInterstitialLoader', function () {
  return create('interstitial', true);
})
.directive('cfFullscreenLoader', function () {
  return create('fullscreen', false);
})
.directive('cfInlineLoader', function () {
  return {
    restrict: 'E',
    scope: {
      isShown: '='
    },
    template:
      '<div ng-show=isShown class="loader loader--inline" aria-lable="loader-inline" role="progressbar" aria-busy="{{ isShown }}">' +
        '<span class="loader__spinner--inline"></span>' +
      '</div>'
  };
});

function create (type, addStateChangeHandlers) {
  var template = '';

  template += '<div class="loader" ng-show=isShown role="progressbar" aria-busy="{{ isShown }}" aria-label="loader-' + type + '">';
  template += '  <div class="loader__container">';
  template += '    <div class="loader__spinner"></div>';
  template += '    <div class="loader__message">{{ loaderMsg }}</div>';
  template += '  </div>';
  template += '</div>';

  return {
    restrict: 'E',
    scope: {
      isShown: '=',
      loaderMsg: '@'
    },
    template: template,
    controller: ['$scope', 'require', function ($scope, require) {
      $scope.loaderMsg = $scope.loaderMsg || 'Please hold on...';

      if (addStateChangeHandlers) {
        var $rootScope = require('$rootScope');
        var notification = require('notification');

        $rootScope.$on('$stateChangeStart', showLoader);
        $rootScope.$on('$stateChangeSuccess', hideLoader);
        $rootScope.$on('$stateChangeCancel', hideLoader);
        $rootScope.$on('$stateNotFound', hideLoader);
        $rootScope.$on('$stateChangeError', function () {
          hideLoader();
          notification.error('A routing error occured.');
        });
      }

      function showLoader () {
        $scope.isShown = true;
      }

      function hideLoader () {
        $scope.isShown = false;
      }
    }]
  };
}
