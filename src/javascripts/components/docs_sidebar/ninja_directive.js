'use strict';

angular.module('contentful').directive('cfNinja', ['require', function (require) {
  var $document = require('$document');
  var $state = require('$state');
  var $timeout = require('$timeout');
  var SumTypes = require('libs/sum-types');
  var caseof = SumTypes.caseofEq;
  var otherwise = SumTypes.otherwise;
  var Ninja = require('components/docs_sidebar/Ninja').default;
  var TheStore = require('TheStore');
  var KEYCODES = require('keycodes');
  var STORE_KEY = 'docsSidebar';

  return {
    template: '<cf-component-bridge component="component">',
    restrict: 'E',
    link: function (scope, el) {

      var state = getState();

      scope.component = Ninja(state);

      var bgSelector = '.docs-helper__bg';

      el.on('click', bgSelector, function (evt) {
        if ($(evt.target).is(bgSelector)) {
          toggle();
        }
      });

      scope.$watch(function () {
        return $state.current.name;
      }, function (stateName) {
        state.view = stateName;
        render(state);
      });

      $document.on('keydown', handleKeydown);

      scope.$on('$destroy', function () {
        $document.off('keydown', handleKeydown);
      });

      function toggle () {
        state.isExpanded = !state.isExpanded;
        dismissCallout();
        render(state);
      }

      function toggleVisibility () {
        state.isHidden = !state.isHidden;
        setStoreValue({isHidden: state.isHidden});
        render(state);
      }

      function dismissCallout () {
        if (!state.calloutSeen) {
          state.calloutSeen = true;
          setStoreValue({calloutSeen: true});
          render(state);
        }
      }

      function updateProgress () {
        if (state.introProgress === 10) {
          state.introCompleted = true;
          setStoreValue({introCompleted: true});
        }
      }

      function handleSpace () {
        if (!state.introCompleted && !state.isHidden && state.isExpanded) {
          state.introProgress += 1;
          // Rerender first then mark intro as completed
          render(state).then(updateProgress);
        }
      }

      function render (state) {
        return $timeout(function () {
          scope.component = Ninja(state);
        });
      }

      function handleKeydown (evt) {
        if ($(evt.target).is($('body, a'))) {
          caseof(evt.keyCode, [
            [KEYCODES.ESC, function () {
              if (state.isExpanded) {
                toggle();
              }
            }],
            [KEYCODES.N, toggleVisibility],
            [KEYCODES.SPACE, handleSpace],
            [otherwise, function () {}]
          ]);
        }
      }

      function setStoreValue (data) {
        var defaults = {
          introCompleted: state.introCompleted,
          isHidden: state.isHidden
        };
        TheStore.set(STORE_KEY, _.merge(defaults, data));
      }

      function getState () {
        var store = TheStore.get(STORE_KEY) || {};
        var defaults = {
          view: $state.current.name || '',
          isExpanded: false,
          isHidden: false,
          calloutSeen: false,
          introCompleted: false,
          introProgress: 1,
          toggle: toggle,
          dismissCallout: dismissCallout
        };

        return _.merge(defaults, store);
      }
    }
  };
}]);
