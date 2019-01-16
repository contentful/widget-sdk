import { registerDirective } from 'NgRegistry.es6';
import mitt from 'mitt';
import { once } from 'lodash';
import * as K from 'utils/kefir.es6';
import SidebarEventTypes from 'app/EntrySidebar/SidebarEventTypes.es6';
import SidebarWidgetTypes from 'app/EntrySidebar/SidebarWidgetTypes.es6';
import createBridge from 'widgets/EditorExtensionBridge.es6';

/**
 * Directive that renders the sidebar for entries and assets
 *
 * TODO: ideally we should strictly isolate sidebar and editor data.
 */
registerDirective('cfEntitySidebar', [
  '$rootScope',
  '$controller',
  '$state',
  'Config.es6',
  'TheLocaleStore',
  'spaceContext',
  'entitySelector',
  'analytics/Analytics.es6',
  (
    $rootScope,
    $controller,
    $state,
    Config,
    TheLocaleStore,
    spaceContext,
    entitySelector,
    Analytics
  ) => ({
    restrict: 'E',
    scope: true,
    template: JST.cf_entity_sidebar(),
    controller: [
      '$scope',
      $scope => {
        const isEntry = $scope.entityInfo.type === 'Entry';
        const isMasterEnvironment = spaceContext.getEnvironmentId() === 'master';

        $scope.widgets = [
          'app/EntrySidebar/PublicationWidget/PublicationWidgetContainer.es6',
          isEntry && 'app/EntrySidebar/ContentPreviewWidget/ContentPreviewWidget.es6',
          'app/EntrySidebar/IncomingLinksWidget/IncomingLinksWidgetContainer.es6',
          'app/EntrySidebar/TranslationWidget/TranslationWidgetContainer.es6',
          isEntry &&
            isMasterEnvironment &&
            'app/EntrySidebar/VersionsWidget/VersionsWidgetContainer.es6',
          'app/EntrySidebar/UsersWidget/UsersWidgetContainer.es6'
        ].filter(item => typeof item === 'string');

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
                locales: TheLocaleStore.getActiveLocales(),
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

        const initializeVersions = once(() => {
          const notifyUpdate = ({ entrySys, publishedVersion }) => {
            $scope.emitter.emit(SidebarEventTypes.UPDATED_VERSIONS_WIDGET, {
              entrySys,
              publishedVersion
            });
          };

          const publishedVersion$ = $scope.otDoc.sysProperty
            .map(sys => sys.publishedVersion)
            .skipDuplicates();

          const updateStream$ = K.combineProperties(
            [$scope.otDoc.sysProperty, publishedVersion$],
            (entrySys, publishedVersion) => ({ entrySys, publishedVersion })
          );

          K.onValue(updateStream$, notifyUpdate);
        });

        const initializePublication = once(() => {
          const notifyUpdate = update => {
            $scope.emitter.emit(SidebarEventTypes.UPDATED_PUBLICATION_WIDGET, {
              ...update,
              commands: {
                primary: $scope.state.primary,
                secondary: $scope.state.secondary,
                revertToPrevious: $scope.state.revertToPrevious
              }
            });
          };

          notifyUpdate({
            status: $scope.state.current,
            updatedAt: K.getValue($scope.otDoc.sysProperty).updatedAt
          });

          K.onValueScope($scope, $scope.otDoc.sysProperty, sys => {
            notifyUpdate({
              status: $scope.state.current,
              updatedAt: sys.updatedAt
            });
          });

          let setNotSavingTimeout;
          K.onValueScope($scope, $scope.otDoc.state.isSaving$.skipDuplicates(), isSaving => {
            clearTimeout(setNotSavingTimeout);
            if (isSaving) {
              notifyUpdate({
                isSaving: true
              });
            } else {
              setNotSavingTimeout = setTimeout(() => {
                notifyUpdate({
                  isSaving: false
                });
              }, 1000);
            }
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
            case SidebarWidgetTypes.VERSIONS:
              initializeVersions();
              break;
            case SidebarWidgetTypes.PUBLICATION:
              initializePublication();
              break;
          }
        });

        // We make sure that we do not leak entity instances from the
        // editor controller into the current scope
        $scope.entity = null;
        $scope.entry = null;
        $scope.asset = null;

        // Construct a list of legacy sidebar extensions
        const legacyExtensions = $scope.editorData.fieldControls.sidebar.map(widget => {
          // A fake field-locale scope to be used in the bridge:
          const fieldLocaleScope = $scope.$new(false);
          fieldLocaleScope.widget = widget;
          // Legacy sidebar extensions work only with the default locale:
          fieldLocaleScope.locale = TheLocaleStore.getDefaultLocale();
          // There's no validity indicator for sidebar extensions.
          // We just provide a noop for this SDK method here:
          fieldLocaleScope.fieldController = { setInvalid: () => {} };
          fieldLocaleScope.fieldLocale = $controller('FieldLocaleController', {
            $scope: fieldLocaleScope
          });

          const bridge = createBridge({
            $rootScope,
            $scope: fieldLocaleScope,
            spaceContext,
            TheLocaleStore,
            entitySelector,
            Analytics
          });

          return { bridge, widget };
        });

        $scope.legacyExtensionsProps = {
          extensions: legacyExtensions,
          appDomain: `app.${Config.domain}`
        };
      }
    ]
  })
]);
