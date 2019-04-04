import mitt from 'mitt';
import { once, get } from 'lodash';
import * as K from 'utils/kefir.es6';
import { getModule } from 'NgRegistry.es6';
import SidebarEventTypes from 'app/EntrySidebar/SidebarEventTypes.es6';
import SidebarWidgetTypes from 'app/EntrySidebar/SidebarWidgetTypes.es6';
import createBridge from 'widgets/bridges/EditorExtensionBridge.es6';
import * as WidgetLocations from 'widgets/WidgetLocations.es6';

const $controller = getModule('$controller');
const $rootScope = getModule('$rootScope');
const spaceContext = getModule('spaceContext');
const $state = getModule('$state');
const TheLocaleStore = getModule('TheLocaleStore');
const entitySelector = getModule('entitySelector');
const SlideInNavigator = getModule('navigation/SlideInNavigator');
const Navigator = getModule('states/Navigator.es6');
const entityCreator = getModule('entityCreator');

export default ({ $scope }) => {
  const isEntry = $scope.entityInfo.type === 'Entry';
  const isMasterEnvironment = spaceContext.getEnvironmentId() === 'master';

  const emitter = mitt();

  const initializeIncomingLinks = once(() => {
    emitter.emit(SidebarEventTypes.UPDATED_INCOMING_LINKS_WIDGET, {
      entityInfo: $scope.entityInfo
    });
  });

  const initializeContentPreview = once(() => {
    const updateEntry = entry => {
      emitter.emit(SidebarEventTypes.UPDATED_CONTENT_PREVIEW_WIDGET, {
        entry,
        contentType: $scope.entityInfo.contentType,
        dataForTracking: {
          locales: $scope.localeData.activeLocales,
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
    emitter.emit(SidebarEventTypes.UPDATED_USERS_WIDGET, []);
    K.onValueScope($scope, $scope.otDoc.collaborators, collaborators => {
      emitter.emit(SidebarEventTypes.UPDATED_USERS_WIDGET, collaborators);
    });
  });

  const initializeVersions = once(() => {
    const notifyUpdate = ({ entrySys, publishedVersion }) => {
      emitter.emit(SidebarEventTypes.UPDATED_VERSIONS_WIDGET, {
        entrySys,
        publishedVersion
      });
    };

    const updateStream$ = $scope.otDoc.sysProperty.map(sys => ({
      entrySys: sys,
      publishedVersion: sys.publishedVersion
    }));

    K.onValue(updateStream$, notifyUpdate);
  });

  const initializePublication = once(() => {
    const notifyUpdate = update => {
      emitter.emit(SidebarEventTypes.UPDATED_PUBLICATION_WIDGET, {
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

  const initializeScheduledPublication = once(() => {
    const notifyUpdate = update => {
      emitter.emit(SidebarEventTypes.UPDATED_SCHEDULED_PUBLICATION_WIDGET, {
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
  });

  const initializeInfoPanel = once(() => {
    const updateProps = update => {
      emitter.emit(SidebarEventTypes.UPDATED_INFO_PANEL, {
        contentType: $scope.entityInfo.contentType,
        ...update
      });
    };

    $scope.$on('show-aux-panel', (_, isVisible) => {
      updateProps({
        isVisible
      });
    });

    K.onValueScope($scope, $scope.otDoc.sysProperty, sys => {
      updateProps({ sys });
    });
  });

  let prevEvent;
  const initializeEntryActivity = once(() => {
    prevEvent = null;
    K.onValueScope($scope, $scope.otDoc.docLocalChanges$, event => {
      if (event) {
        // Only emit "changed" events if they are followed by a "blur".
        // This means that the user made a change and then left the field and we avoid
        // logging activities on every keystroke.
        if (event.name === 'blur' && get(prevEvent, 'name') === 'changed') {
          emitter.emit(SidebarEventTypes.UPDATED_DOCUMENT_STATE, {
            name: 'changed',
            path: event.path
          });
        } else if (event.name !== 'changed' && event.name !== 'blur') {
          emitter.emit(SidebarEventTypes.UPDATED_DOCUMENT_STATE, event);
        }
      }

      prevEvent = event;
    });
  });

  emitter.on(SidebarEventTypes.WIDGET_REGISTERED, name => {
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
      case SidebarWidgetTypes.SCHEDULED_PUBLICATION:
        initializeScheduledPublication();
        break;
      case SidebarWidgetTypes.INFO_PANEL:
        initializeInfoPanel();
        break;
      case SidebarWidgetTypes.ACTIVITY:
        initializeEntryActivity();
        break;
    }
  });

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

    const bridge = createBridge(
      {
        $rootScope,
        $scope: fieldLocaleScope,
        spaceContext,
        TheLocaleStore,
        entitySelector,
        entityCreator,
        Navigator,
        SlideInNavigator
      },
      WidgetLocations.LOCATION_ENTRY_FIELD_SIDEBAR
    );

    return { bridge, widget };
  });

  const sidebarExtensionsBridge = createBridge(
    {
      $rootScope,
      $scope,
      spaceContext,
      TheLocaleStore,
      entitySelector,
      entityCreator,
      Navigator,
      SlideInNavigator
    },
    WidgetLocations.LOCATION_ENTRY_SIDEBAR
  );

  return {
    legacySidebarExtensions: legacyExtensions,
    localeData: $scope.localeData,
    sidebar: $scope.editorData.sidebar,
    sidebarExtensions: $scope.editorData.sidebarExtensions,
    sidebarExtensionsBridge,
    isEntry,
    isMasterEnvironment,
    emitter
  };
};
