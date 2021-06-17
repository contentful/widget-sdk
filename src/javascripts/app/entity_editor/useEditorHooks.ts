import { useEffect, useMemo, useRef, useState } from 'react';
import mitt from 'mitt';
import createEntrySidebarProps, { EntrySidebarProps } from 'app/EntrySidebar/EntitySidebarBridge';
import initLocaleData, {
  assignLocaleData,
  getStatusNotificationPropsDefault,
} from 'app/entity_editor/setLocaleData';
import { useProxyState } from 'core/services/proxy';
import { useSpaceEnvContentTypes, useSpaceEnvContext } from 'core/services/SpaceEnvContext';
import { getEditorState } from './editorState';
import installTracking from './Tracking';
import * as K from 'core/utils/kefir';
import { useSpaceEnvEndpoint } from 'core/hooks/useSpaceEnvEndpoint';
import { usePubSubClient } from 'core/hooks';
import { useCurrentSpaceAPIClient } from 'core/services/APIClient/useCurrentSpaceAPIClient';
import { getBatchingApiClient } from 'app/widgets/WidgetApi/BatchingApiClient';

export const useEmitter = () => {
  const { current: emitter } = useRef(mitt());
  return emitter;
};

export const useEditorState = ({ editorData, preferences, trackView }) => {
  const { currentSpaceId, currentEnvironmentId } = useSpaceEnvContext();
  const { currentSpaceContentTypes } = useSpaceEnvContentTypes();
  const lifeline = K.useLifeline();

  const [title, setTitle] = useState('');
  const [state, setState] = useState();

  const editorState = useMemo(() => {
    return getEditorState({
      editorData,
      environmentId: currentEnvironmentId,
      hasInitialFocus: preferences.hasInitialFocus,
      lifeline: lifeline.stream,
      onStateUpdate: setState,
      onTitleUpdate: setTitle,
      contentTypes: currentSpaceContentTypes,
      spaceId: currentSpaceId,
      trackView,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (editorState) {
      installTracking(editorData.entityInfo, editorState.doc, lifeline.stream);
    }
  }, [editorState, editorData.entityInfo, lifeline.stream]);

  if (editorState) {
    return { doc: editorState.doc, editorContext: editorState.editorContext, state, title };
  } else {
    return { state, title };
  }
};

export const useLocaleData = ({
  editorContext,
  editorData,
  emitter,
  otDoc,
  shouldHideLocaleErrors,
}) => {
  const entityLabel = editorData.entityInfo.type.toLowerCase();
  const [localeData] = useProxyState(assignLocaleData());
  const [inited, setInited] = useState(false);
  const [statusNotificationProps, setStatusNotificationProps] = useState(
    getStatusNotificationPropsDefault(entityLabel)
  );
  const statusNotificationPropsDep = JSON.stringify(statusNotificationProps);
  const localeDateDep = JSON.stringify(localeData);

  useEffect(() => {
    const onUpdate = ({ statusNotificationProps }) => {
      setStatusNotificationProps(statusNotificationProps);
    };

    initLocaleData({
      initialValues: {
        localeData,
        editorContext,
        editorData,
        otDoc,
      },
      entityLabel,
      emitter,
      shouldHideLocaleErrors,
      onUpdate,
    });
    setInited(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  return useMemo(
    () => ({ localeData, statusNotificationProps }),
    [statusNotificationPropsDep, inited, localeDateDep]
  );
};

export const useEntrySidebarProps = ({
  editorContext,
  editorData,
  emitter,
  fieldController,
  localeData,
  otDoc,
  preferences,
  state,
}) => {
  const [entrySidebarProps, setEntrySidebarProps] = useState<
    [EntrySidebarProps, (args: any) => void] | []
  >([]);

  const {
    currentSpace,
    currentSpaceId,
    currentEnvironmentAliasId,
    currentEnvironmentId,
    currentEnvironment,
  } = useSpaceEnvContext();
  const { currentSpaceContentTypes } = useSpaceEnvContentTypes();

  const spaceEndpoint = useSpaceEnvEndpoint();
  const { client: cma } = useCurrentSpaceAPIClient();
  const pubSubClient = usePubSubClient();

  useEffect(() => {
    if (state && pubSubClient && !entrySidebarProps[0] && currentSpace && cma) {
      const props = createEntrySidebarProps({
        aliasId: currentEnvironmentAliasId,
        editorContext,
        editorData,
        emitter,
        environmentId: currentEnvironmentId,
        fieldController,
        localeData,
        otDoc,
        preferences,
        space: currentSpace,
        spaceId: currentSpaceId,
        state,
        spaceEndpoint,
        contentTypes: currentSpaceContentTypes,
        pubSubClient,
        environment: currentEnvironment,
        cma: getBatchingApiClient(cma),
      });
      setEntrySidebarProps(props);
    }
  }, [
    currentEnvironmentAliasId,
    currentEnvironmentId,
    currentSpace,
    currentSpaceId,
    editorContext,
    editorData,
    emitter,
    entrySidebarProps,
    fieldController,
    localeData,
    otDoc,
    preferences,
    state,
    spaceEndpoint,
    currentSpaceContentTypes,
    pubSubClient,
    currentEnvironment,
    cma,
  ]);

  return entrySidebarProps;
};
