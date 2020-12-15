import { once, memoize } from 'lodash';
import * as K from 'core/utils/kefir';
import { getModule } from 'core/NgRegistry';
import { getCurrentStateName } from 'states/Navigator';
import SidebarEventTypes from 'app/EntrySidebar/SidebarEventTypes';
import SidebarWidgetTypes from 'app/EntrySidebar/SidebarWidgetTypes';
import TheLocaleStore from 'services/localeStore';
import { createFieldWidgetSDK, createSidebarWidgetSDK } from 'app/widgets/ExtensionSDKs';
import { toRendererWidget } from 'widgets/WidgetCompat';
import { makeFieldLocaleListeners } from 'app/entry_editor/makeFieldLocaleListeners';

export default ({
  entityInfo,
  localeData,
  editorData,
  editorContext,
  otDoc,
  state,
  fieldController,
  preferences,
  emitter,
}) => {
  const spaceContext = getModule('spaceContext');

  const isEntry = entityInfo.type === 'Entry';
  const aliasId = spaceContext.getAliasId();
  const environmentId = spaceContext.getEnvironmentId();
  const isMasterEnvironment = spaceContext.isMasterEnvironment();

  const initializeIncomingLinks = once(() => {
    emitter.emit(SidebarEventTypes.UPDATED_INCOMING_LINKS_WIDGET, {
      entityInfo: entityInfo,
    });
  });

  const initializeContentPreview = once(() => {
    const updateEntry = (entry) => {
      emitter.emit(SidebarEventTypes.UPDATED_CONTENT_PREVIEW_WIDGET, {
        entry,
        contentType: entityInfo.contentType,
        dataForTracking: {
          locales: localeData.activeLocales,
          fromState: getCurrentStateName(),
          entryId: entityInfo.id,
        },
      });
    };
    updateEntry(null);
    K.onValue(otDoc.data$, (entry) => {
      updateEntry(entry);
    });
  });

  const initializeUsers = once(() => {
    emitter.emit(SidebarEventTypes.UPDATED_USERS_WIDGET, []);
    K.onValue(otDoc.presence.collaborators, (collaborators) => {
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

    const updateStream$ = otDoc.sysProperty.map((sys) => ({
      entrySys: sys,
      publishedVersion: sys.publishedVersion,
    }));

    K.onValue(updateStream$, notifyUpdate);
  });

  const initializePublication = once(() => {
    const notifyUpdate = (update) => {
      const entity = K.getValue(otDoc.data$);
      emitter.emit(SidebarEventTypes.UPDATED_PUBLICATION_WIDGET, {
        ...update,
        entity: entity && { ...entity }, // `undefined` after entity deletion.
        spaceId: spaceContext.space.getId(),
        environmentId: aliasId || environmentId,
        isMasterEnvironment,
        userId: spaceContext.user.sys.id,
        validator: editorContext.validator,
        commands: {
          primary: state.primary,
          secondary: state.secondary,
          revertToPrevious: state.revertToPrevious,
        },
      });
    };

    notifyUpdate({
      status: state.current,
      updatedAt: K.getValue(otDoc.sysProperty).updatedAt,
    });

    K.onValue(otDoc.sysProperty, (sys) => {
      notifyUpdate({
        status: state.current,
        updatedAt: sys.updatedAt,
      });
    });

    // Listen for state updates, specifically "published" -> "changed" on pending local changes,
    // which might be triggered before the auto-save request is fired changing the sys property.
    K.onValue(otDoc.resourceState.state$, () => {
      notifyUpdate({
        status: state.current,
      });
    });

    let setNotSavingTimeout;
    K.onValue(otDoc.state.isSaving$, (isSaving) => {
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

  const initializeReleases = once(() => {
    const entity = K.getValue(otDoc.data$);
    emitter.emit(SidebarEventTypes.UPDATED_RELEASES_WIDGET, {
      entityInfo: entityInfo,
      entity: entity && { ...entity },
      contentType: entityInfo.contentType,
    });
  });

  const initializeTasksWidget = once(() => {
    const notifyUpdate = (update) => {
      emitter.emit(SidebarEventTypes.UPDATED_TASKS_WIDGET, {
        ...update,
        entityInfo: entityInfo,
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
        contentType: entityInfo.contentType,
        ...update,
      });
    };

    K.onValue(otDoc.sysProperty, (sys) => {
      updateProps({ sys });
    });
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
      case SidebarWidgetTypes.RELEASES:
        initializeReleases();
        break;
      case SidebarWidgetTypes.TASKS:
        initializeTasksWidget();
        break;
      case SidebarWidgetTypes.INFO_PANEL:
        initializeInfoPanel();
        break;
    }
  });

  // Construct a list of legacy sidebar extensions
  const legacyExtensions = editorData.fieldControls.sidebar.map((widget) => {
    return {
      makeSdk: memoize(() =>
        createFieldWidgetSDK({
          // Legacy sidebar extensions use field-bound SDK for the default locale.
          fieldId: widget.fieldId,
          localeCode: TheLocaleStore.getDefaultLocale().code,
          widgetNamespace: widget.widgetNamespace,
          widgetId: widget.widgetId,
          spaceContext,
          editorData,
          setInvalid: fieldController?.setInvalid,
          localeData,
          preferences,
          doc: otDoc,
          internalContentType: entityInfo.contentType,
          parameters: widget.parameters,
          fieldLocaleListeners: makeFieldLocaleListeners(
            editorData.fieldControls.all,
            editorContext,
            localeData.privateLocales,
            localeData.defaultLocale,
            otDoc
          ),
        })
      ),
      widget: toRendererWidget(widget.descriptor),
      field: widget.field,
    };
  });

  const makeSidebarWidgetSDK = memoize(
    (widgetNamespace, widgetId, parameters) => {
      return createSidebarWidgetSDK({
        internalContentType: entityInfo.contentType,
        editorData,
        localeData,
        preferences,
        doc: otDoc,
        parameters,
        spaceContext,
        widgetNamespace,
        widgetId,
        fieldLocaleListeners: makeFieldLocaleListeners(
          editorData.fieldControls.all,
          editorContext,
          localeData.privateLocales,
          localeData.defaultLocale,
          otDoc
        ),
      });
    },
    (ns, id, params) => [ns, id, JSON.stringify(params)].join(',')
  );

  return {
    legacySidebarExtensions: legacyExtensions,
    localeData: localeData,
    entityInfo: entityInfo,
    sidebar: editorData.sidebar,
    sidebarExtensions: editorData.sidebarExtensions,
    makeSidebarWidgetSDK,
    isEntry,
    isMasterEnvironment,
    emitter,
  };
};
