'use strict';

angular.module('contentful').directive('cfContextualHelpSidebar', ['require', function (require) {
  var $document = require('$document');
  var $state = require('$state');
  var SumTypes = require('libs/sum-types');
  var caseof = SumTypes.caseofEq;
  var otherwise = SumTypes.otherwise;
  var ContextualSidebarStore = require('components/contextual_help/Store');
  var ContextualSidebarComponent = require('components/contextual_help/ContextualHelpSidebarComponent').default;
  var KEYCODES = require('utils/keycodes').default;
  var spaceContext = require('spaceContext');
  var user$ = require('services/TokenStore').user$;
  var $stateParams = require('$stateParams');
  var $q = require('$q');
  var K = require('utils/kefir');
  var logger = require('logger');

  return {
    template: '<cf-component-bridge component="component">',
    restrict: 'E',
    controller: ['$scope', function ($scope) {
      // initial empty render as data is loaded asynchronously
      $scope.component = ContextualSidebarComponent(null);

      // init store with sane data
      $q.all([
        getCurrentSpaceId(),
        getFirstEntryId(),
        getFirstContentType(),
        getToken()
      ]).then(function (values) {
        var userId = K.getValue(user$).sys.id;

        ContextualSidebarStore.init(userId, {
          view: $state.current.name,
          spaceId: values[0],
          entryId: values[1],
          contentType: values[2],
          apiKeyId: values[3].id,
          token: values[3].accessToken
        }, {
          render: render
        });

        ContextualSidebarStore.checkNavigatedWhileOpen();

        render();
      }).catch(function (error) {
        logger.logError('Could not instantiate the contextual sidebar', error);
      });

      $document[0].addEventListener('click', handleClick, true);

      $document.on('keydown', handleKeydown);

      $scope.$on('$destroy', function () {
        $document.off('keydown', handleKeydown);
        $document[0].removeEventListener('click', handleClick, true);
      });

      function handleClick (e) {
        var isTargetChildOfSidebar = !!$(e.target).parents('.contextual-help__main-container').length;
        var isContextualHelpVisible = $('.contextual-help__modal').hasClass('contextual-help__modal--fade-in');
        var isContainerVisible = !$('.contextual-help__main-container').hasClass('contextual-help__main-container--hidden');

        if (isContainerVisible && isContextualHelpVisible && !isTargetChildOfSidebar) {
          ContextualSidebarStore.minimize();
        }
      }

      function render () {
        $scope.component = ContextualSidebarComponent(ContextualSidebarStore.get());
        $scope.$applyAsync();
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
        if (spaceContext && spaceContext.publishedCTs.getAllBare) {
          var ct = _.sortBy(spaceContext.publishedCTs.getAllBare(), function (ct) {
            return ct.name.length;
          })[0];

          return {
            id: ct.sys.id,
            name: ct.name
          };
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
                return {
                  accessToken: '<No API key found. Please create one from the API page.>',
                  id: null
                };
              } else {
                var key = apiKeys[0];

                return {
                  accessToken: key.accessToken,
                  id: key.sys.id
                };
              }
            });
        } else {
          logger.logError('Could not fetch API keys due to empty or uninitialized space context');
        }
      }

      function handleKeydown (evt) {
        caseof(evt.keyCode, [
          [KEYCODES.ESC, ContextualSidebarStore.minimize],
          [KEYCODES.H, function () {
            var $target = $(evt.target);

            if (!$target.is('input, textarea, [contenteditable="true"]')) {
              ContextualSidebarStore.toggleVisibility();
            }
          }],
          [KEYCODES.SPACE, function () {
            var state = ContextualSidebarStore.get().state;

            if (state.isExpanded) {
              evt.preventDefault();
              evt.stopPropagation();
              ContextualSidebarStore.continueIntro();
            }
          }],
          [otherwise, _.noop]
        ]);
      }
    }]
  };
}]);
