'use strict';

angular.module('contentful').directive('cfNinja', ['require', function (require) {
  var $document = require('$document');
  var $state = require('$state');
  var $timeout = require('$timeout');
  var SumTypes = require('libs/sum-types');
  var caseof = SumTypes.caseofEq;
  var otherwise = SumTypes.otherwise;
  var NinjaStore = require('components/docs_sidebar/Store');
  var Ninja = require('components/docs_sidebar/Ninja').default;
  var KEYCODES = require('keycodes');

  return {
    template: '<cf-component-bridge component="component">',
    restrict: 'E',
    link: function (scope, el) {

      NinjaStore.setView($state.current.name);

      var ninjaData = {
        state: NinjaStore.get(),
        actions: {
          toggle: toggle,
          dismissCallout: dismissCallout,
          render: render
        }
      };

      scope.component = Ninja(ninjaData);

      var bgSelector = '.docs-sidebar__bg';

      el.on('click', bgSelector, function (evt) {
        if ($(evt.target).is(bgSelector)) {
          toggle();
        }
      });

      $document.on('keydown', handleKeydown);

      scope.$on('$destroy', function () {
        $document.off('keydown', handleKeydown);
      });

      function render () {
        ninjaData.state = NinjaStore.get();
        return $timeout(function () {
          scope.component = Ninja(ninjaData);
        });
      }

      function toggle () {
        NinjaStore.toggle();
        render();
      }

      function toggleVisibility () {
        NinjaStore.toggleVisibility();
        render();
      }

      function dismissCallout () {
        NinjaStore.dismissCallout();
        render();
      }

      function handleSpace () {
        // Don't do anything if all steps have been completed
        if (ninjaData.state.introProgress < 4) {
          NinjaStore.continueIntro();
          render().then(NinjaStore.completeIntro);
        }
      }

      function handleKeydown (evt) {
        var target = evt.target || evt.srcElement;

        if ($(target).is($('body, a'))) {
          caseof(evt.keyCode, [
            [KEYCODES.ESC, function () {
              if (ninjaData.state.isExpanded) {
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
