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
  var spaceContext = require('spaceContext');
  var $stateParams = require('$stateParams');
  var $q = require('$q');
  var logger = require('logger');

  return {
    template: '<cf-component-bridge component="component">',
    restrict: 'E',
    link: function (scope) {
      var ninjaData = {
        state: NinjaStore.get(),
        actions: {
          toggle: toggle,
          dismissCallout: dismissCallout,
          render: render
        }
      };

      scope.component = Ninja(null); // initial empty render a data is loaded asynchronously

      // init store with sane data
      $q.all([
        getCurrentSpaceId(),
        getFirstEntryId(),
        getFirstContentType(),
        getToken()
      ]).then(function (values) {
        NinjaStore.setView($state.current.name);
        NinjaStore.setSpaceData({
          spaceId: values[0],
          entryId: values[1],
          contentType: values[2]
        });
        NinjaStore.setToken(values[3]);

        render();
      }).catch(function (error) {
        logger.logError('Could not instantiate the contextual sidebar', error);
      });

      $document[0].addEventListener('click', function (e) {
        var isChildOfSidebar = !!$(e.target).parents('.docs-sidebar__main-container').length;

        if (!isChildOfSidebar && $('.docs-sidebar__modal').is(':visible')) {
          hide();
        }
      }, true);

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

      function getFirstEntryId () {
        if (spaceContext && spaceContext.cma) {
          return spaceContext.cma
            .getEntries()
            .then(function (entries) {
              return entries.items[0].sys.id;
            });
        } else {
          return $q.reject('Could not fetch entries due to empty or uninitialized space context');
        }
      }

      function getFirstContentType () {
        if (spaceContext && spaceContext.cma) {
          return spaceContext.cma
            .getContentTypes()
            .then(function (cts) {
              var ct = _.find(cts.items, function (v) {
                return v.name.length < 20;
              });

              if (!ct) {
                ct = cts.items[0];
              }

              return {
                id: ct.sys.id,
                name: ct.name
              };
            });
        } else {
          return $q.reject('Could not fetch content types due to empty or uninitialized space context');
        }
      }

      function getCurrentSpaceId () {
        return $q.resolve($stateParams.spaceId);
      }

      function getToken () {
        if (spaceContext && spaceContext.apiKeyRepo) {
          return spaceContext.apiKeyRepo
            .getAll()
            .then(function (apiKeys) {
              if (!apiKeys.length) {
                return '<No API key found. Please create one from the API page.>';
              } else {
                return apiKeys[0].accessToken;
              }
            });
        } else {
          logger.logError('Could not fetch API keys due to empty or uninitialized space context');
        }
      }

      function toggle () {
        NinjaStore.toggle();
        render();
      }

      function hide () {
        NinjaStore.hide();
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
