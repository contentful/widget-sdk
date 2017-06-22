'use strict';

angular.module('contentful').directive('cfNinja', ['require', function (require) {
  var $document = require('$document');
  var $state = require('$state');
  var $timeout = require('$timeout');
  var SumTypes = require('libs/sum-types');
  var caseof = SumTypes.caseofEq;
  var otherwise = SumTypes.otherwise;
  var KEYCODES = require('keycodes');
  var Ninja = require('components/docs_sidebar/Ninja').default;

  return {
    template: '<cf-component-bridge component="component">',
    restrict: 'E',
    link: function (scope, el) {

      var state = {
        view: $state.current.name || '',
        isExpanded: false,
        isVisible: true,
        toggle: toggle,
        intro: {
          completed: false,
          progress: 1
        }
      };

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
        update(state);
      }

      function updateProgress () {
        if (!state.intro.completed && state.intro.progress >= 10) {
          state.intro.completed = true;
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
    }
  };
}]);
