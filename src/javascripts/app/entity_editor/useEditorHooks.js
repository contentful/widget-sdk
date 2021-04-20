import { useEffect, useMemo, useRef, useState } from 'react';
import mitt from 'mitt';
import createEntrySidebarProps from 'app/EntrySidebar/EntitySidebarBridge';
import initLocaleData, {
  assignLocaleData,
  getStatusNotificationPropsDefault,
} from 'app/entity_editor/setLocaleData';
import { useProxyState } from 'core/services/proxy';
import { useSpaceEnvContext } from 'core/services/SpaceEnvContext/useSpaceEnvContext';
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

export const useEditorState = ({
  currentSlideLevel,
  editorData,
  preferences,
  editorType,
  trackView,
}) => {
  const { currentSpaceContentTypes, currentSpaceId, currentEnvironmentId } = useSpaceEnvContext();
  const lifeline = K.useLifeline();

  const [title, setTitle] = useState('');
  const [state, setState] = useState();

  const { doc, editorContext } = useMemo(() => {
    return getEditorState({
      currentSlideLevel,
      editorData,
      editorType,
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
    installTracking(editorData.entityInfo, doc, lifeline.stream);
  }, [doc, editorData.entityInfo, lifeline.stream]);

  return { doc, editorContext, state, title };
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
  const [statusNotificationProps, setStatusNotificationProps] = useState(
    getStatusNotificationPropsDefault(entityLabel)
  );

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { localeData, statusNotificationProps };
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
  const [entrySidebarProps, setEntrySidebarProps] = useState([]);

  const {
    currentSpace,
    currentSpaceId,
    currentEnvironmentAliasId,
    currentEnvironmentId,
    currentSpaceContentTypes,
    currentEnvironment,
  } = useSpaceEnvContext();

  const spaceEndpoint = useSpaceEnvEndpoint();
  const cma = useCurrentSpaceAPIClient();
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
