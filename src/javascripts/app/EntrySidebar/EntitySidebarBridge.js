import { once } from 'lodash';
import * as K from 'utils/kefir';
import { getModule } from 'core/NgRegistry';
import { getCurrentStateName } from 'states/Navigator';
import SidebarEventTypes from 'app/EntrySidebar/SidebarEventTypes';
import SidebarWidgetTypes from 'app/EntrySidebar/SidebarWidgetTypes';
import createExtensionBridge from 'widgets/bridges/createExtensionBridge';
import * as WidgetLocations from 'widgets/WidgetLocations';
import TheLocaleStore from 'services/localeStore';

export default ({ $scope, emitter }) => {
  const $controller = getModule('$controller');
  const $rootScope = getModule('$rootScope');
  const spaceContext = getModule('spaceContext');

  const isEntry = $scope.entityInfo.type === 'Entry';
  const isMasterEnvironment = spaceContext.isMasterEnvironment();

  const initializeIncomingLinks = once(() => {
    emitter.emit(SidebarEventTypes.UPDATED_INCOMING_LINKS_WIDGET, {
      entityInfo: $scope.entityInfo,
    });
  });

  const initializeContentPreview = once(() => {
    const updateEntry = (entry) => {
      emitter.emit(SidebarEventTypes.UPDATED_CONTENT_PREVIEW_WIDGET, {
        entry,
        contentType: $scope.entityInfo.contentType,
        dataForTracking: {
          locales: $scope.localeData.activeLocales,
          fromState: getCurrentStateName(),
          entryId: $scope.entityInfo.id,
        },
      });
    };
    updateEntry(null);
    K.onValueScope($scope, $scope.otDoc.data$, (entry) => {
      updateEntry(entry);
    });
  });

  const initializeUsers = once(() => {
    emitter.emit(SidebarEventTypes.UPDATED_USERS_WIDGET, []);
    K.onValueScope($scope, $scope.otDoc.presence.collaborators, (collaborators) => {
      emitter.emit(SidebarEventTypes.UPDATED_USERS_WIDGET, collaborators);
    });
  });

  const initializeVersions = once(() => {
    const notifyUpdate = ({ entrySys, publishedVersion }) => {
      emitter.emit(SidebarEventTypes.UPDATED_VERSIONS_WIDGET, {
        entrySys,
        publishedVersion,
      });
    };

    const updateStream$ = $scope.otDoc.sysProperty.map((sys) => ({
      entrySys: sys,
      publishedVersion: sys.publishedVersion,
    }));

    K.onValue(updateStream$, notifyUpdate);
  });

  const initializePublication = once(() => {
    const notifyUpdate = (update) => {
      const entity = K.getValue($scope.otDoc.data$);
      emitter.emit(SidebarEventTypes.UPDATED_PUBLICATION_WIDGET, {
        ...update,
        entity: entity && { ...entity }, // `undefined` after entity deletion.
        spaceId: spaceContext.space.getId(),
        environmentId: spaceContext.getEnvironmentId(),
        isMasterEnvironment: spaceContext.isMasterEnvironment(),
        userId: spaceContext.user.sys.id,
        validator: $scope.editorContext.validator,
        commands: {
          primary: $scope.state.primary,
          secondary: $scope.state.secondary,
          revertToPrevious: $scope.state.revertToPrevious,
        },
      });
    };

    notifyUpdate({
      status: $scope.state.current,
      updatedAt: K.getValue($scope.otDoc.sysProperty).updatedAt,
    });

    K.onValueScope($scope, $scope.otDoc.sysProperty, (sys) => {
      notifyUpdate({
        status: $scope.state.current,
        updatedAt: sys.updatedAt,
      });
    });

    let setNotSavingTimeout;
    K.onValueScope($scope, $scope.otDoc.state.isSaving$, (isSaving) => {
      clearTimeout(setNotSavingTimeout);
      if (isSaving) {
        notifyUpdate({
          isSaving: true,
        });
      } else {
        setNotSavingTimeout = setTimeout(() => {
          notifyUpdate({
            isSaving: false,
          });
        }, 1000);
      }
    });
  });

  const initializeTasksWidget = once(() => {
    const notifyUpdate = (update) => {
      emitter.emit(SidebarEventTypes.UPDATED_TASKS_WIDGET, {
        ...update,
        entityInfo: $scope.entityInfo,
        endpoint: spaceContext.endpoint,
        users: spaceContext.users,
        currentUser: spaceContext.user,
        isSpaceAdmin: (user) => spaceContext.space.isAdmin(user),
      });
    };
    notifyUpdate({});
  });

  const initializeInfoPanel = once(() => {
    const updateProps = (update) => {
      emitter.emit(SidebarEventTypes.UPDATED_INFO_PANEL, {
        contentType: $scope.entityInfo.contentType,
        ...update,
      });
    };

    $scope.$on('show-aux-panel', (_, isVisible) => {
      updateProps({
        isVisible,
      });
    });

    K.onValueScope($scope, $scope.otDoc.sysProperty, (sys) => {
      updateProps({ sys });
    });
  });

  let commentsPanelDelistener;

  const initializeCommentsPanel = once(() => {
    const init = once(() => {
      // init will fetch all comments. we don't want that until
      // the comments tab is opened for the first time
      emitter.emit(SidebarEventTypes.INIT_COMMENTS_PANEL, {
        entryId: $scope.entityInfo.id,
        endpoint: spaceContext.endpoint,
      });
    });

    commentsPanelDelistener = $scope.$on('show-comments-panel', (_, isVisible) => {
      init();
      emitter.emit(SidebarEventTypes.UPDATED_COMMENTS_PANEL, {
        isVisible,
      });
    });
  });

  const deinitializeCommentsPanel = once(() => {
    commentsPanelDelistener && commentsPanelDelistener();
    commentsPanelDelistener = undefined;
  });

  emitter.on(SidebarEventTypes.WIDGET_DEREGISTERED, (name) => {
    switch (name) {
      case SidebarWidgetTypes.COMMENTS_PANEL:
        deinitializeCommentsPanel();
        break;
    }
  });

  emitter.on(SidebarEventTypes.WIDGET_REGISTERED, (name) => {
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
      case SidebarWidgetTypes.COMMENTS_PANEL:
        initializeCommentsPanel();
        break;
    }
  });

  // Construct a list of legacy sidebar extensions
  const legacyExtensions = $scope.editorData.fieldControls.sidebar.map((widget) => {
    // A fake field-locale scope to be used in the bridge:
    const fieldLocaleScope = $scope.$new(false);
    fieldLocaleScope.widget = widget;
    // Legacy sidebar extensions work only with the default locale:
    fieldLocaleScope.locale = TheLocaleStore.getDefaultLocale();
    // There's no validity indicator for sidebar extensions.
    // We just provide a noop for this SDK method here:
    fieldLocaleScope.fieldController = { setInvalid: () => {} };
    fieldLocaleScope.fieldLocale = $controller('FieldLocaleController', {
      $scope: fieldLocaleScope,
    });

    const bridge = createExtensionBridge({
      $rootScope,
      $scope: fieldLocaleScope,
      spaceContext,
      $controller,
      currentWidgetId: widget.id,
      currentWidgetNamespace: widget.namespace,
      location: WidgetLocations.LOCATION_ENTRY_FIELD_SIDEBAR,
    });

    return { bridge, widget };
  });

  const buildSidebarExtensionsBridge = (currentWidgetId, currentWidgetNamespace) =>
    createExtensionBridge({
      $rootScope,
      $scope,
      spaceContext,
      $controller,
      currentWidgetId,
      currentWidgetNamespace,
      location: WidgetLocations.LOCATION_ENTRY_SIDEBAR,
    });

  return {
    legacySidebarExtensions: legacyExtensions,
    localeData: $scope.localeData,
    sidebar: $scope.editorData.sidebar,
    sidebarExtensions: $scope.editorData.sidebarExtensions,
    buildSidebarExtensionsBridge,
    isEntry,
    isMasterEnvironment,
    emitter,
  };
};
