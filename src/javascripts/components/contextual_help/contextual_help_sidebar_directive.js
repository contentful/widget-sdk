'use strict';

angular.module('contentful').directive('cfContextualHelpSidebar', ['require', require => {
  const $document = require('$document');
  const $state = require('$state');
  const SumTypes = require('sum-types');
  const caseof = SumTypes.caseofEq;
  const otherwise = SumTypes.otherwise;
  const ContextualSidebarStore = require('components/contextual_help/Store');
  const ContextualSidebarComponent = require('components/contextual_help/ContextualHelpSidebarComponent').default;
  const KEYCODES = require('utils/keycodes').default;
  const spaceContext = require('spaceContext');
  const user$ = require('services/TokenStore').user$;
  const $stateParams = require('$stateParams');
  const $q = require('$q');
  const K = require('utils/kefir');
  const logger = require('logger');

  return {
    template: '<cf-component-bridge component="component">',
    restrict: 'E',
    controller: ['$scope', $scope => {
      // initial empty render as data is loaded asynchronously
      $scope.component = ContextualSidebarComponent(null);

      // init store with sane data
      $q.all([
        getCurrentSpaceId(),
        getFirstEntryId(),
        getFirstContentType(),
        getToken()
      ]).then(values => {
        const userId = K.getValue(user$).sys.id;

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
      }).catch(error => {
        logger.logError('Could not instantiate the contextual sidebar', error);
      });

      $document[0].addEventListener('click', handleClick, true);

      $document.on('keydown', handleKeydown);

      $scope.$on('$destroy', () => {
        $document.off('keydown', handleKeydown);
        $document[0].removeEventListener('click', handleClick, true);
      });

      function handleClick (e) {
        const isTargetChildOfSidebar = !!$(e.target).parents('.contextual-help__main-container').length;
        const isContextualHelpVisible = $('.contextual-help__modal').hasClass('contextual-help__modal--fade-in');
        const isContainerVisible = !$('.contextual-help__main-container').hasClass('contextual-help__main-container--hidden');

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
            .then(entries => entries.items[0].sys.id);
        } else {
          return $q.reject('Could not fetch entries due to empty or uninitialized space context');
        }
      }

      function getFirstContentType () {
        if (spaceContext && spaceContext.publishedCTs && spaceContext.publishedCTs.getAllBare) {
          const ct = _.sortBy(spaceContext.publishedCTs.getAllBare(), ct => ct.name.length)[0];

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
            .then(apiKeys => {
              if (!apiKeys.length) {
                return {
                  accessToken: '<No API key found. Please create one from the API page.>',
                  id: null
                };
              } else {
                const key = apiKeys[0];

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
          [KEYCODES.H, () => {
            const $target = $(evt.target);

            if (!$target.is('input, textarea, [contenteditable="true"]')) {
              ContextualSidebarStore.toggleVisibility();
            }
          }],
          [KEYCODES.SPACE, () => {
            const state = ContextualSidebarStore.get().state;

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
