import { AssetEditor } from 'app/asset_editor/AssetEditor';
import { EntryEditor } from 'app/entry_editor/EntryEditor';
import React, { FunctionComponent } from 'react';
import { EmptyState } from './EmptyState';
import { Slide, SlideState, ViewProps } from './SlideInEditor/types';
import { useEntityLoader } from './useEntityLoader';
import { getSlideAsString } from 'navigation/SlideInNavigator';

import { BulkEditorWrapper } from './bulk_editor/BulkEditorWrapper';
import { Preferences } from 'app/widgets/ExtensionSDKs/createEditorApi';
import { RequestState } from './Components/FetchLinksToEntity';
import { useState, useEffect } from 'react';
import fetchLinks from './Components/FetchLinksToEntity/fetchLinks';
import { once } from 'lodash';

interface EntityEditorProps {
  slide: Slide;
  hasInitialFocus: boolean;
  slideStates: SlideState[];
  updateSlideStateByKey: Function;
  fieldController?: object;
  fields?: object;
}

export const EntityEditor: FunctionComponent<EntityEditorProps> = (props) => {
  const {
    slide,
    hasInitialFocus,
    slideStates,
    updateSlideStateByKey,
    fieldController,
    fields,
  } = props;

  const [{ editorData, loadingError }, trackLoadEvent] = useEntityLoader(slide, slideStates);
  const [incomingLinksResponse, setIncomingLinksResponse] = useState({
    links: [] as unknown,
    state: RequestState.PENDING,
  });
  const { id: entityId, type: entityType } = (editorData?.entityInfo || {}) as {
    id?: string;
    type?: string;
  };

  useEffect(
    once(() => {
      if (!entityId || !entityType) {
        return;
      }
      fetchLinks(entityId, entityType)
        .then((links) => {
          setIncomingLinksResponse({
            links,
            state: RequestState.SUCCESS,
          });
        })
        .catch(() =>
          setIncomingLinksResponse({
            links: [],
            state: RequestState.ERROR,
          })
        );
    }),
    [entityId, entityType]
  );

  const slideKey = getSlideAsString(slide);
  if (!editorData || loadingError) {
    if (loadingError) {
      updateSlideStateByKey(slideKey, { loadingError });
    }
    return <EmptyState slideState={{ slide, loadingError }} />;
  }

  const preferences: Preferences = {
    showDisabledFields: false,
    hasInitialFocus,
  };

  const viewProps: ViewProps = {
    editorData,
    trackLoadEvent,
    preferences,
  };

  const editorProps = {
    viewProps,
    fieldController,
    fields,
  };

  updateSlideStateByKey(slideKey, { viewProps });
  const { type } = slide;
  switch (type) {
    case 'Asset':
      return <AssetEditor {...editorProps} incomingLinksResponse={incomingLinksResponse} />;
    case 'Entry':
      return (
        <EntryEditor
          {...editorProps}
          currentSlideLevel={slideStates.length}
          incomingLinksResponse={incomingLinksResponse}
        />
      );
    case 'BulkEditor':
      return <BulkEditorWrapper slide={slide} editorData={editorData} />;
    default:
      throw new Error(`Unknown editor type "${type}"`);
  }
};
