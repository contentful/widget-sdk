import { registerDirective } from 'NgRegistry.es6';
import mitt from 'mitt';
import { once } from 'lodash';
import * as K from 'utils/kefir.es6';
import SidebarEventTypes from 'app/EntitySidebar/SidebarEventTypes.es6';
import SidebarWidgetTypes from 'app/EntitySidebar/SidebarWidgetTypes.es6';

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
registerDirective('cfEntitySidebar', [
  '$state',
  'spaceContext',
  ($state, spaceContext) => ({
    restrict: 'E',
    scope: true,
    template: JST.cf_entity_sidebar(),
    controller: [
      '$scope',
      $scope => {
        $scope.emitter = mitt();

        const initializeIncomingLinks = once(() => {
          $scope.emitter.emit(SidebarEventTypes.UPDATED_INCOMING_LINKS_WIDGET, {
            entityInfo: $scope.entityInfo
          });
        });

        const initializeContentPreview = once(() => {
          const updateEntry = entry => {
            $scope.emitter.emit(SidebarEventTypes.UPDATED_CONTENT_PREVIEW_WIDGET, {
              entry,
              contentType: $scope.entityInfo.contentType,
              dataForTracking: {
                locales: $scope.locales,
                fromState: $state.current.name,
                entryId: $scope.entityInfo.id
              }
            });
          };
          updateEntry(null);
          K.onValueScope($scope, $scope.otDoc.data$, entry => {
            updateEntry(entry);
          });
        });

        const initializeUsers = once(() => {
          $scope.emitter.emit(SidebarEventTypes.UPDATED_USERS_WIDGET, []);
          K.onValueScope($scope, $scope.otDoc.collaborators, collaborators => {
            $scope.emitter.emit(SidebarEventTypes.UPDATED_USERS_WIDGET, collaborators);
          });
        });

        $scope.emitter.on(SidebarEventTypes.WIDGET_REGISTERED, name => {
          switch (name) {
            case SidebarWidgetTypes.INCOMING_LINKS:
              initializeIncomingLinks();
              break;
            case SidebarWidgetTypes.CONTENT_PREVIEW:
              initializeContentPreview();
              break;
            case SidebarWidgetTypes.USERS:
              initializeUsers();
              break;
          }
        });

        $scope.data = {
          isEntry: $scope.entityInfo.type === 'Entry',
          isMasterEnvironment: spaceContext.getEnvironmentId() === 'master'
        };

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
      }
    ]
  })
]);
