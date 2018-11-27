angular
  .module('contentful')

  /**
   * @description
   * Directive that renders the sidebar for entries and assets
   *
   * TODO we should use an isolated scope
   *
   * @scope.requires {object} preferences.showAuxPanel
   *   Determines whether we show the entity information
   * @scope.requires {object} locales
   *   An instance of 'entityEditor/LocalesController' to change active
   *   locales.
   * @scope.requires {object} state
   *   An instance of 'entityEditor/StateController'
   * @scope.requires {object} otDoc
   *   An instance of 'app/entity_editor/Document'
   * @scope.requires {object} entityInfo
   *   As provided by the entry/asset editor controller
   * @scope.requires {object} sidebarControls
   *   These probably need a lot of stuff in return
   */
  .directive('cfEntitySidebar', [
    'require',
    require => {
      const K = require('utils/kefir.es6');
      const $state = require('$state');
      const { throttle } = require('lodash');
      const spaceContext = require('spaceContext');

      return {
        restrict: 'E',
        scope: true,
        template: JST.cf_entity_sidebar(),
        controller: [
          '$scope',
          $scope => {
            $scope.data = {
              isEntry: $scope.entityInfo.type === 'Entry',
              isMasterEnvironment: spaceContext.getEnvironmentId() === 'master'
            };

            $scope.sidebarIncomingLinksProps = {
              entityInfo: $scope.entityInfo
            };

            $scope.sidebarContentPreviewProps = {
              entry: null,
              contentType: $scope.entityInfo.contentType,
              getDataForTracking: () => ({
                locales: $scope.locales,
                fromState: $state.current.name,
                entryId: $scope.entityInfo.id
              })
            };

            // updating props on every quick change of model
            // (while user is typing) isn't performant,
            // so we throttle update by 300ms
            // (it's hard to move focus from intput to preview button quicker)
            const updateSidebarProps = throttle(entry => {
              $scope.sidebarContentPreviewProps = {
                ...$scope.sidebarContentPreviewProps,
                entry
              };
              $scope.$applyAsync();
            }, 300);

            K.onValueScope($scope, $scope.otDoc.data$, entry => {
              updateSidebarProps(entry);
            });

            // We make sure that we do not leak entity instances from the
            // editor controller into the current scope
            $scope.entity = null;
            $scope.entry = null;
            $scope.asset = null;

            $scope.entitySys$ = $scope.otDoc.sysProperty;

            // This code is responsible for showing the saving indicator. We
            // debounce switching the indicator off so that it is shown for
            // at least one second.
            let setNotSavingTimeout;
            K.onValueScope($scope, $scope.otDoc.state.isSaving$.skipDuplicates(), isSaving => {
              clearTimeout(setNotSavingTimeout);
              if (isSaving) {
                $scope.data.documentIsSaving = true;
              } else {
                setNotSavingTimeout = setTimeout(() => {
                  $scope.data.documentIsSaving = false;
                  $scope.$apply();
                }, 1000);
              }
            });

            K.onValueScope($scope, $scope.otDoc.sysProperty, sys => {
              $scope.data.documentUpdatedAt = sys.updatedAt;
            });

            K.onValueScope($scope, $scope.otDoc.collaborators, collaborators => {
              $scope.data.docCollaborators = collaborators;
            });
          }
        ]
      };
    }
  ]);
