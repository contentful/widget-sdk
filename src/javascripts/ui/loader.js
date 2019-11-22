import { registerDirective } from 'NgRegistry';
import _ from 'lodash';
import { h } from 'utils/legacy-html-hyperscript';

export default function register() {
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
  registerDirective('cfLoader', () => ({
    restrict: 'E',
    scope: {
      isShown: '=?',
      loaderMsg: '@',
      watchStateChange: '@'
    },
    template: h(
      '.loader',
      {
        ngShow: 'isShown',
        role: 'progressbar',
        ariaBusy: '{{isShown}}',
        ariaLabel: 'loader-interstitial'
      },
      [
        h('.loader__container', [
          h('react-component', {
            name: '@contentful/forma-36-react-components/Spinner',
            props: '{size: "large", style: {display: "block"}}'
          }),
          h(
            'div',
            {
              style: {
                marginLeft: '10px',
                fontSize: '2em'
              }
            },
            ['{{loaderMsg}}']
          )
        ])
      ]
    ),
    controller: [
      '$scope',
      '$rootScope',
      '$parse',
      ($scope, $rootScope, $parse) => {
        $scope.watchStateChange = $parse($scope.watchStateChange)();
        $scope.loaderMsg = $scope.loaderMsg || 'Please hold on…';

        if ($scope.watchStateChange) {
          $scope.$on(
            '$destroy',
            _.flow(
              $rootScope.$on('$stateChangeStart', showLoader),
              $rootScope.$on('$stateChangeSuccess', hideLoader),
              $rootScope.$on('$stateChangeCancel', hideLoader),
              $rootScope.$on('$stateNotFound', hideLoader),
              $rootScope.$on('$stateChangeError', hideLoader)
            )
          );
        }

        function showLoader(_event, _toState, _toParams, _fromState, _fromParams, options) {
          // If `options.notify` gets set to `false` in another `$state...` event
          // handler then above handlers triggering `hideLoader` would never fire.
          // TODO: Use Proxy instead once we drop IE 11 support.
          let notify = options.notify;
          Object.defineProperty(options, 'notify', {
            configurable: true,
            enumerable: true,
            set: function(value) {
              (value ? showLoader : hideLoader)();
              notify = value;
            },
            get: function() {
              return notify;
            }
          });
          $scope.isShown = notify;
        }

        function hideLoader() {
          $scope.isShown = false;
        }
      }
    ]
  }));

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
  registerDirective('cfInlineLoader', () => ({
    restrict: 'E',
    scope: {
      isShown: '='
    },
    template: h(
      '.loader.loader--inline',
      {
        ngShow: 'isShown',
        role: 'progressbar',
        ariaBusy: '{{isShown}}',
        ariaLabel: 'loader-inline'
      },
      [h('.loader__spinner--inline')]
    )
  }));
}