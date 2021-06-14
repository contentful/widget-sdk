import { once, memoize, noop } from 'lodash';
import * as K from 'core/utils/kefir';
import { getSpaceContext } from 'classes/spaceContext';
import { getCurrentStateName } from 'states/Navigator';
import SidebarEventTypes from 'app/EntrySidebar/SidebarEventTypes';
import SidebarWidgetTypes from 'app/EntrySidebar/SidebarWidgetTypes';
import TheLocaleStore from 'services/localeStore';
import { createFieldWidgetSDK, createSidebarWidgetSDK } from 'app/widgets/ExtensionSDKs';
import { toRendererWidget } from 'widgets/WidgetCompat';
import { makeFieldLocaleListeners } from 'app/entry_editor/makeFieldLocaleListeners';
import createUserCache from 'data/userCache';
import { user$ } from 'services/TokenStore';
import {
  getEnvironment,
  isMasterEnvironment as isMaster,
} from 'core/services/SpaceEnvContext/utils';
import { createAPIClient } from '../../core/services/APIClient/utils';
import { WidgetNamespace } from '@contentful/widget-renderer';
import { Source } from '../../i13n/constants';
import { User } from 'core/services/SpaceEnvContext/types';
import { LocaleData } from 'app/entity_editor/EntityField/types';
import { SidebarExtensionSDK } from '@contentful/app-sdk';

export interface EntrySidebarProps {
  legacySidebarExtensions?: {
    makeSdk: any;
    widget: any;
    field: any;
  }[];
  localeData: LocaleData;
  entityInfo: any;
  sidebar?: { widgetId: string; widgetNamespace: WidgetNamespace; disabled?: boolean }[];
  sidebarExtensions?: {
    widgetId: string;
    widgetNamespace: WidgetNamespace;
    descriptor?: any;
    problem?: string;
  }[];
  makeSidebarWidgetSDK: (
    widgetNamespace: WidgetNamespace,
    widgetId: string,
    parameters: any
  ) => SidebarExtensionSDK;
  isEntry: boolean;
  isMasterEnvironment: boolean;
  emitter: {
    on: (eventName: string, handler: mitt.Handler) => void;
    off: (eventName: string, handler: mitt.Handler) => void;
    emit: (eventName: string, data?: any) => void;
  };
}
export default function EntitySidebarBridge({
  localeData,
  editorData,
  editorContext,
  otDoc,
  state,
  fieldController,
  preferences,
  emitter,
  aliasId,
  environmentId,
  spaceId,
  space,
  spaceEndpoint,
  environment,
  contentTypes,
  pubSubClient,
  cma,
}): [EntrySidebarProps, (args: any) => void] {
  const spaceContext = getSpaceContext();
  const isMasterEnvironment = isMaster(getEnvironment(space));

  const { entityInfo } = editorData;
  const users = createUserCache(spaceEndpoint);
  const user = K.getValue<User>(user$);
  const isEntry = entityInfo.type === 'Entry';

  let initializeIncomingLinks = noop;

  const setIncomingLinks = (...args) => {
    //set the links now or register to be set once the sidebar widget
    //is ready
    initializeIncomingLinks = () => {
      emitter.emit(SidebarEventTypes.UPDATED_INCOMING_LINKS_WIDGET, ...args);
    };
    initializeIncomingLinks();
  };

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

    K.onValue(updateStream$, notifyUpdate as any);
  });

  const initializePublication = once(() => {
    const notifyUpdate = (update) => {
      const entity = K.getValue(otDoc.data$);
      emitter.emit(SidebarEventTypes.UPDATED_PUBLICATION_WIDGET, {
        ...update,
        entity: entity && { ...(entity as Record<string, unknown>) }, // `undefined` after entity deletion.
        spaceId,
        environmentId: aliasId || environmentId,
        isMasterEnvironment,
        userId: user?.sys.id,
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
      updatedAt: K.getValue<{ updatedAt: string }>(otDoc.sysProperty).updatedAt,
    });

    K.onValue(otDoc.sysProperty, (sys) => {
      notifyUpdate({
        status: state.current,
        updatedAt: (sys as { updatedAt: string }).updatedAt,
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
      entity: entity && { ...(entity as Record<string, unknown>) },
      contentType: entityInfo.contentType,
    });
  });

  const initializeTasksWidget = once(() => {
    const notifyUpdate = (update) => {
      emitter.emit(SidebarEventTypes.UPDATED_TASKS_WIDGET, {
        ...update,
        entityInfo: entityInfo,
        endpoint: spaceEndpoint,
        users,
        currentUser: user,
        isSpaceAdmin: (user) => space.isAdmin(user),
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
          spaceId,
          environmentAliasId: aliasId,
          environmentId,
          space,
          environment,
          contentTypes,
          pubSubClient,
          cma,
        })
      ),
      widget: toRendererWidget(widget.descriptor),
      field: widget.field,
    };
  });

  const makeSidebarWidgetSDK = memoize(
    (widgetNamespace, widgetId, parameters) => {
      const source =
        widgetNamespace === WidgetNamespace.SIDEBAR_BUILTIN ? undefined : Source.CustomWidget;

      const resolvedEnvironmentId = spaceContext.getAliasId() || spaceContext.getEnvironmentId();

      const cma = createAPIClient(spaceContext.getId(), resolvedEnvironmentId, source);

      return createSidebarWidgetSDK({
        internalContentType: entityInfo.contentType,
        editorData,
        localeData,
        preferences,
        doc: otDoc,
        parameters,
        cma,
        spaceContext,
        fieldLocaleListeners: makeFieldLocaleListeners(
          editorData.fieldControls.all,
          editorContext,
          localeData.privateLocales,
          localeData.defaultLocale,
          otDoc
        ),
        widgetId,
        widgetNamespace,
      });
    },
    (ns, id, params) => [ns, id, JSON.stringify(params)].join(',')
  );

  return [
    {
      legacySidebarExtensions: legacyExtensions,
      localeData: localeData,
      entityInfo: entityInfo,
      sidebar: editorData.sidebar,
      sidebarExtensions: editorData.sidebarExtensions,
      makeSidebarWidgetSDK,
      isEntry,
      isMasterEnvironment,
      emitter,
    },
    setIncomingLinks,
  ];
}
