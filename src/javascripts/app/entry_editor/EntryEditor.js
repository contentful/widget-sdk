import React, { Fragment, useEffect, useLayoutEffect } from 'react';
import PropTypes from 'prop-types';
import * as K from 'core/utils/kefir';
import { bootstrapEntryEditorLoadEvents } from 'app/entity_editor/LoadEventTracker';
import { trackEntryView } from '../entity_editor/Tracking';
import { keys } from 'lodash';
import DocumentTitle from 'components/shared/DocumentTitle';
import EntryEditorWorkbenchWithProvider from 'app/entry_editor/EntryEditorWorkbench';
import { useProxyState } from 'core/services/proxy';
import {
  useLocaleData,
  useEntrySidebarProps,
  useEditorState,
  useEmitter,
} from '../entity_editor/useEditorHooks';
import { useContentTypes } from 'core/services/SpaceEnvContext';
import { getBatchingApiClient } from 'app/widgets/WidgetApi/BatchingApiClient';
import { useCurrentSpaceAPIClient } from 'core/services/APIClient/useCurrentSpaceAPIClient';

export const EntryEditor = (props) => {
  const { currentSpaceContentTypes } = useContentTypes();
  const { client: cma } = useCurrentSpaceAPIClient();

  // @TODO remove getViewProps() as soon as feature flag * is removed
  const {
    viewProps = props.getViewProps(),
    fieldController,
    fields,
    currentSlideLevel,
    incomingLinksResponse,
  } = props;

  const { editorData, trackLoadEvent } = viewProps;

  const emitter = useEmitter();

  const [preferences] = useProxyState({ ...viewProps.preferences });

  const { doc: otDoc, editorContext, state, title } = useEditorState({
    editorData,
    preferences,
    trackView: (args) => {
      trackEntryView({
        ...args,
        currentSlideLevel,
        editorType: currentSlideLevel > 1 ? 'slide_in_editor' : 'entry_editor',
        cma: getBatchingApiClient(cma),
        publishedCTs: currentSpaceContentTypes,
      });
    },
  });

  const shouldHideLocaleErrors = (localeData) => {
    const { errors, focusedLocale } = localeData;
    const localeCodes = keys(errors);
    return localeCodes.length === 1 && localeCodes[0] === focusedLocale.internal_code;
  };

  const { localeData, statusNotificationProps } = useLocaleData({
    editorContext,
    editorData,
    emitter,
    otDoc,
    shouldHideLocaleErrors,
  });

  const loadEvents = K.useLifeline();
  useLayoutEffect(() => {
    bootstrapEntryEditorLoadEvents(otDoc, loadEvents, editorData, trackLoadEvent);
  }, [editorData, loadEvents, otDoc, trackLoadEvent]);

  //TODO: can useEntrySidebarProps be moved up to EntityEditor?
  const [entrySidebarProps, setIncomingLinks] = useEntrySidebarProps({
    editorContext,
    editorData,
    emitter,
    fieldController,
    localeData,
    otDoc,
    preferences,
    state,
  });

  useEffect(() => {
    if (!setIncomingLinks) {
      return;
    }
    setIncomingLinks({
      entityInfo: editorData.entityInfo,
      incomingLinksResponse,
    });
  }, [editorData.entityInfo, setIncomingLinks, incomingLinksResponse]);

  return (
    <Fragment>
      <DocumentTitle title={[title, 'Content']} />
      <EntryEditorWorkbenchWithProvider
        editorContext={editorContext}
        editorData={editorData}
        entrySidebarProps={entrySidebarProps}
        fields={fields}
        loadEvents={loadEvents}
        localeData={localeData}
        otDoc={otDoc}
        preferences={preferences}
        state={state}
        statusNotificationProps={statusNotificationProps}
        title={title}
        incomingLinks={incomingLinksResponse.links}
      />
    </Fragment>
  );
};

EntryEditor.propTypes = {
  viewProps: PropTypes.object,
  getViewProps: PropTypes.func,
  currentSlideLevel: PropTypes.number.isRequired,
  fieldController: PropTypes.object,
  fields: PropTypes.object,
  incomingLinksResponse: PropTypes.any,
};

EntryEditor.defaultProps = {
  currentSlideLevel: 0,
};
