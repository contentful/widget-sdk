'use strict';

angular.module('contentful')
.directive('cfCliDescriptionOnboard', ['require', function (require) {
  var h = require('utils/hyperscript').h;
  var templates = require('app/home/app_entry_onboard/cli_description_onboard/template');
  var renderTemplate = templates.render;
  var prefix = templates.prefix;
  var $timeout = require('$timeout');
  var tokenStore = require('services/TokenStore');
  var nav = require('states/Navigator');
  var ModalDialog = require('modalDialog');
  var auth = require('Authentication');
  var makeFetchSpacesWithAuth = require('data/CMA/Spaces').makeFetchSpacesWithAuth;

  // Fetches data from the '/spaces' endpoint and returns
  // list of spaces with metadata for pagination
  // This method is used opposed to the TokenStore#refresh
  // due to the cost of the latter
  var fetchSpaces = makeFetchSpacesWithAuth(auth);

  // We don't want to fetch user's spaces too often
  // and we enable button as soon as any space was added
  // so, at the moment user will switch back from the CLI
  // this check should be already fetched, even with 10s
  // delay
  var REFRESH_SPACES_INTERVAL = 10000;

  return {
    restrict: 'E',
    scope: {
      back: '&'
    },
    template: '<cf-component-bridge component="myComponent">',
    controllerAs: 'cliDescription',
    controller: ['$scope', function ($scope) {
      $scope.$watch('complete', render);
      $scope.complete = false;

      $scope.handleMissingNode = function () {
        $scope.dialog = ModalDialog.open({
          template: h('.modal-background', [
            h('.modal-dialog.' + prefix + '__modal-container', [
              h('header.modal-dialog__header', [
                h('h1', [
                  'Having trouble installing the CLI?'
                ]),
                h('button.modal-dialog__close', {
                  ngClick: 'dialog.confirm()'
                })
              ]),
              h('.modal-dialog__content', [
                h('div', [
                  'To install and run the Contentful command line tool, node.js is required.'
                ]),
                h('ul.' + prefix + '__modal-list', [
                  h('li.' + prefix + '__modal-elem', [
                    'Get node.js from ',
                    h('a', {
                      href: 'https://nodejs.org',
                      target: '_blank'
                    }, ['nodejs.org'])
                  ]),
                  h('li.' + prefix + '__modal-elem', [
                    'Then come here and continue the process.'
                  ])
                ]),
                h('.' + prefix + '__modal-note', [
                  'Node.js® is a JavaScript runtime built on Chrome\'s V8 JavaScript engine. ' +
                  'Node.js uses an event-driven, non-blocking I/O model that makes it lightweight ' +
                  'and efficient. Node.js\' package ecosystem, npm, is the largest ecosystem of ' +
                  'open source libraries in the world.'
                ]),
                h('button.btn-action.' + prefix + '__modal-btn', {
                  ngClick: 'dialog.confirm()'
                }, [
                  'Done'
                ])
              ])
            ])
          ]),
          scope: $scope
        });
      };

      var spaceId = null;
      var checkSpacesTimerId = null;

      checkSpaces();

      $scope.navigateToCreatedSpace = function () {
        return nav.go({
          path: ['spaces', 'detail'],
          params: {
            spaceId: spaceId
          }
        });
      };

      $scope.$on('$destroy', function () {
        $timeout.cancel(checkSpacesTimerId);
      });

      function render () {
        $scope.myComponent = renderTemplate($scope, renderWithApply);
      }

      function renderWithApply () {
        render();
        $scope.$applyAsync();
      }

      function checkSpaces () {
        fetchSpaces().then(function (data) {
          if (data.total > 0) {
            // we need to refresh token with all the info first,
            // so home screen for the space will be available
            // we can't use spaces info from the `tokenStore.fetchSpaces`,
            // because it does not contain all needed info
            tokenStore.refresh().then(function () {
              $scope.complete = true;
              spaceId = data.items[0].sys.id;
            });
          } else {
            // if we still have 0 spaces, then we need to do it once again
            recheckSpaces();
          }
        // if we fail during the fetching, let's just fetch again after
        // REFRESH_INTERVAL
        }, recheckSpaces);
      }

      function recheckSpaces () {
        checkSpacesTimerId = $timeout(checkSpaces, REFRESH_SPACES_INTERVAL);
      }
    }]
  };
}]);
