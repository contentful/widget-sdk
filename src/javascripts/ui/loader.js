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
 *   cf-loader(is-shown="isLoading", watch-state-change="true", loader-msg="Loading…")
 *
 * cf-loader(watch-state-change="true") //- this adds only a state change loader
 * cf-loader(loader-msg="Please wait…")
 * cf-loader(is-shown="isLoading")
 * cf-loader(is-shown="somePropFromParentScope" loader-msg="Loading xyz…")
 */
.directive('cfLoader', ['require', function (require) {
  var h = require('utils/hyperscript').h;
  var spinner = require('ui/Components/Spinner').default;
  var Layout = require('ui/Layout');
  var hspace = Layout.hspace;
  var container = Layout.container;

  return {
    restrict: 'E',
    scope: {
      isShown: '=?',
      loaderMsg: '@',
      watchStateChange: '@'
    },
    template: h('.loader', {
      ngShow: 'isShown',
      role: 'progressbar',
      ariaBusy: '{{isShown}}',
      ariaLabel: 'loader-interstitial'
    }, [
      h('.loader__container', [
        spinner({ diameter: '36px' }),
        hspace('10px'),
        container({ fontSize: '2em' }, [
          '{{loaderMsg}}'
        ])
      ])
    ]),
    controller: ['$scope', 'require', function ($scope, require) {
      var $rootScope = require('$rootScope');
      var $parse = require('$parse');

      $scope.watchStateChange = $parse($scope.watchStateChange)();
      $scope.loaderMsg = $scope.loaderMsg || 'Please hold on…';

      if ($scope.watchStateChange) {
        $scope.$on('$destroy', _.flow(
          $rootScope.$on('$stateChangeStart', showLoader),
          $rootScope.$on('$stateChangeSuccess', hideLoader),
          $rootScope.$on('$stateChangeCancel', hideLoader),
          $rootScope.$on('$stateNotFound', hideLoader),
          $rootScope.$on('$stateChangeError', hideLoader)
        ));
      }

      function showLoader (_event, _toState, toParams, _fromState, fromParams) {
        toParams = toParams || {};
        fromParams = fromParams || {};
        // Do not show a spinner when navigating from/to slide in
        // entry editor. This will refresh the parent/child entries
        // without showing the spinner.
        // TODO: Remove this once "feature-at-05-2018-sliding-entry-editor-multi-level"
        // experiment is over.
        if (!toParams.inlineEntryId && !fromParams.inlineEntryId) {
          $scope.isShown = true;
        }
      }

      function hideLoader () {
        $scope.isShown = false;
      }
    }]
  };
}])
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
.directive('cfInlineLoader', ['require', function (require) {
  var h = require('utils/hyperscript').h;

  return {
    restrict: 'E',
    scope: {
      isShown: '='
    },
    template: h('.loader.loader--inline', {
      ngShow: 'isShown',
      role: 'progressbar',
      ariaBusy: '{{isShown}}',
      ariaLabel: 'loader-inline'
    }, [
      h('.loader__spinner--inline')
    ])
  };
}]);
