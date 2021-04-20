import React, { Fragment, useEffect } from 'react';
import PropTypes from 'prop-types';
import { keys } from 'lodash';
import DocumentTitle from 'components/shared/DocumentTitle';
import { useProxyState } from 'core/services/proxy';
import AssetEditorWorkbench from './AssetEditorWorkbench';
import {
  useLocaleData,
  useEntrySidebarProps,
  useEditorState,
  useEmitter,
} from '../entity_editor/useEditorHooks';

export const AssetEditor = (props) => {
  // @TODO remove getViewProps() as soon as feature flag * is removed
  const {
    viewProps = props.getViewProps(),
    fieldController,
    fields,
    incomingLinksResponse,
  } = props;
  const { editorData } = viewProps;

  const [preferences] = useProxyState({ ...viewProps.preferences });

  const emitter = useEmitter();

  const { state, title, doc, editorContext } = useEditorState({
    editorData,
    preferences,
  });

  const shouldHideLocaleErrors = (localeData) => {
    if (!localeData.isSingleLocaleModeOn) {
      return false;
    }
    return (
      keys(localeData.errors).length === 1 &&
      localeData.defaultLocale.internal_code === localeData.focusedLocale.internal_code
    );
  };

  const { localeData, statusNotificationProps } = useLocaleData({
    editorContext,
    editorData,
    emitter,
    otDoc: doc,
    shouldHideLocaleErrors,
  });

  //TODO: can useEntrySidebarProps be moved up to EntityEditor?
  const [entrySidebarProps, setIncomingLinks] = useEntrySidebarProps({
    editorContext,
    editorData,
    emitter,
    fieldController,
    localeData,
    otDoc: doc,
    preferences,
    state,
    incomingLinksResponse,
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
      <DocumentTitle title={[title, 'Media']} />
      <AssetEditorWorkbench
        editorContext={editorContext}
        editorData={editorData}
        entrySidebarProps={entrySidebarProps}
        fields={fields}
        localeData={localeData}
        otDoc={doc}
        preferences={preferences}
        state={state}
        statusNotificationProps={statusNotificationProps}
        title={title}
        incomingLinks={incomingLinksResponse.links}
      />
    </Fragment>
  );
};

AssetEditor.propTypes = {
  viewProps: PropTypes.object,
  getViewProps: PropTypes.func,
  fieldController: PropTypes.object,
  fields: PropTypes.object,
  incomingLinksResponse: PropTypes.any,
};
