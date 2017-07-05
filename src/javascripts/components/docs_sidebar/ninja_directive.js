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
        update(state);
      });

      $document.on('keydown', handleKeydown);

      scope.$on('$destroy', function () {
        $document.off('keydown', handleKeydown);
      });

      function toggle () {
        updateProgress();
        state.isExpanded = !state.isExpanded;
        update(state);
      }

      function toggleVisibility () {
        updateProgress();
        state.isVisible = !state.isVisible;
        setStoreValue({isVisible: state.isVisible});
        update(state);
      }

      function updateProgress () {
        if (!state.intro.completed && state.intro.progress >= 10) {
          state.intro.completed = true;
          setStoreValue({introCompleted: true});
        }
      }

      function handleSpace () {
        if (!state.intro.completed && state.isVisible && state.isExpanded) {
          state.intro.progress += 1;
          update(state);
        }
      }

      function update (state) {
        $timeout(function () {
          scope.component = Ninja(state);
        });
      }

      function handleKeydown (evt) {
        if ($(evt.target).is('body')) {
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
          introCompleted: state.intro.completed,
          isVisible: state.isVisible
        };
        TheStore.set(STORE_KEY, _.merge(defaults, data));
      }

      function getState () {
        var store = TheStore.get(STORE_KEY) || {};
        var isCompleted = !!store.introCompleted;
        var isVisible = !!store.isVisible || true;

        return {
          view: $state.current.name || '',
          isExpanded: false,
          isVisible: isVisible,
          toggle: toggle,
          intro: {
            completed: isCompleted,
            progress: 1
          }
        };
      }
    }
  };
}]);
