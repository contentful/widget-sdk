// Based on
// https://gist.github.com/RadoMark/fbd501b26e0c389c4135
angular.module('contentful').directive('watchersToggler', [
  '$parse',
  '$timeout',
  ($parse, $timeout) => ({
    restrict: 'EA',

    scope: {
      toggler: '&watchersToggler',
      refreshSuspensionOn: '=refreshHideOn'
    },

    link: function($scope, _element, _attrs) {
      const watchers = {
        suspended: false
      };

      $scope.$watch(
        () => $scope.toggler(),
        newToggler => {
          if (typeof newToggler === 'boolean') {
            if (newToggler) {
              suspendFromRoot();
            } else {
              resumeFromRoot();
            }
          }
        }
      );

      $scope.$watch(
        'refreshSuspensionOn',
        (newVal, oldVal) => {
          if (newVal !== oldVal) {
            refreshSuspensionFromRoot();
          }
        },
        true
      );

      function suspendFromRoot() {
        if (!watchers.suspended) {
          $timeout(() => {
            suspendWatchers();
            watchers.suspended = true;
          });
        }
      }

      function refreshSuspensionFromRoot() {
        if (watchers.suspended) {
          $timeout(() => {
            suspendWatchers();
          });
        }
      }

      function resumeFromRoot() {
        if (watchers.suspended) {
          $timeout(() => {
            resumeWatchers();
            watchers.suspended = false;
          });
        }
      }

      function suspendWatchers() {
        iterateSiblings($scope, suspendScopeWatchers);
        iterateChildren($scope, suspendScopeWatchers);
      }

      function resumeWatchers() {
        iterateSiblings($scope, resumeScopeWatchers);
        iterateChildren($scope, resumeScopeWatchers);
      }

      const mockScopeWatch = scopeId => (
        watchExp,
        listener,
        objectEquality,
        prettyPrintExpression
      ) => {
        watchers[scopeId].unshift({
          fn: angular.isFunction(listener) ? listener : angular.noop,
          last: undefined,
          get: $parse(watchExp),
          exp: prettyPrintExpression || watchExp,
          eq: !!objectEquality
        });
      };

      function suspendScopeWatchers(scope) {
        if (!watchers[scope.$id]) {
          watchers[scope.$id] = scope.$$watchers || [];
          scope.$$watchers = [];
          scope.$watch = mockScopeWatch(scope.$id);
        }
      }

      function resumeScopeWatchers(scope) {
        if (watchers[scope.$id]) {
          scope.$$watchers = watchers[scope.$id];
          if (scope.hasOwnProperty('$watch')) {
            delete scope.$watch;
          }
          watchers[scope.$id] = false;
        }
      }

      function iterateSiblings(scope, operationOnScope) {
        while ((scope = scope.$$nextSibling)) {
          operationOnScope(scope);
          iterateChildren(scope, operationOnScope);
        }
      }

      function iterateChildren(scope, operationOnScope) {
        while ((scope = scope.$$childHead)) {
          operationOnScope(scope);
          iterateSiblings(scope, operationOnScope);
        }
      }
    }
  })
]);
