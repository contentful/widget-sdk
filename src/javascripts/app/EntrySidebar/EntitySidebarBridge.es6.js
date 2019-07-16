import { once, get } from 'lodash';
import * as K from 'utils/kefir.es6';
import { getModule } from 'NgRegistry.es6';
import SidebarEventTypes from 'app/EntrySidebar/SidebarEventTypes.es6';
import SidebarWidgetTypes from 'app/EntrySidebar/SidebarWidgetTypes.es6';
import createExtensionBridge from 'widgets/bridges/createExtensionBridge.es6';
import * as WidgetLocations from 'widgets/WidgetLocations.es6';
import * as SlideInNavigator from 'navigation/SlideInNavigator/index.es6';
import * as Navigator from 'states/Navigator.es6';
import TheLocaleStore from 'services/localeStore.es6';

const $controller = getModule('$controller');
const $rootScope = getModule('$rootScope');
const spaceContext = getModule('spaceContext');
const $state = getModule('$state');
const entitySelector = getModule('entitySelector');
const entityCreator = getModule('entityCreator');

export default ({ $scope, emitter }) => {
  const isEntry = $scope.entityInfo.type === 'Entry';
  const isMasterEnvironment = spaceContext.isMasterEnvironment();

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
        entity: { ...$scope.editorData.entity.data },
        spaceId: spaceContext.space.getId(),
        environmentId: spaceContext.getEnvironmentId(),
        isMasterEnvironment: spaceContext.isMasterEnvironment(),
        userId: spaceContext.user.sys.id,
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

  const initializeTasksWidget = once(() => {
    const notifyUpdate = update => {
      emitter.emit(SidebarEventTypes.UPDATED_TASKS_WIDGET, {
        ...update,
        entityInfo: $scope.entityInfo,
        spaceId: spaceContext.space.getId(),
        envId: spaceContext.getEnvironmentId(),
        users: spaceContext.users,
        currentUser: spaceContext.user
      });
    };
    notifyUpdate({});
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

  let commentsPanelDelistener;

  const initializeCommentsPanel = once(() => {
    const {
      entityInfo: { id }
    } = $scope;

    const init = once(() => {
      // init will fetch all comments. we don't want that until
      // the comments tab is opened for the first time
      emitter.emit(SidebarEventTypes.INIT_COMMENTS_PANEL, {
        entryId: id,
        spaceId: spaceContext.getId(),
        environmentId: spaceContext.getEnvironmentId()
      });
    });

    commentsPanelDelistener = $scope.$on('show-comments-panel', (_, isVisible) => {
      init();
      emitter.emit(SidebarEventTypes.UPDATED_COMMENTS_PANEL, {
        isVisible
      });
    });
  });

  const deinitializeCommentsPanel = once(() => {
    commentsPanelDelistener && commentsPanelDelistener();
    commentsPanelDelistener = undefined;
    $rootScope.$broadcast('resetPreference', 'show-comments-panel');
  });

  emitter.on(SidebarEventTypes.WIDGET_DEREGISTERED, name => {
    switch (name) {
      case SidebarWidgetTypes.COMMENTS_PANEL:
        deinitializeCommentsPanel();
        break;
    }
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
      case SidebarWidgetTypes.TASKS:
        initializeTasksWidget();
        break;
      case SidebarWidgetTypes.INFO_PANEL:
        initializeInfoPanel();
        break;
      case SidebarWidgetTypes.ACTIVITY:
        initializeEntryActivity();
        break;
      case SidebarWidgetTypes.COMMENTS_PANEL:
        initializeCommentsPanel();
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

    const bridge = createExtensionBridge(
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

  const sidebarExtensionsBridge = createExtensionBridge(
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
    isSpaceAdmin: user => spaceContext.space.isAdmin(user),
    emitter
  };
};
