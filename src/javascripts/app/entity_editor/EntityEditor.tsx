import { AssetEditor } from 'app/asset_editor/AssetEditor';
import { EntryEditor } from 'app/entry_editor/EntryEditor';
import React, { FunctionComponent } from 'react';
import { EmptyState } from './EmptyState';
import { Slide, SlideState, ViewProps } from './SlideInEditor/types';
import { useEntityLoader } from './useEntityLoader';
import { getSlideAsString } from 'navigation/SlideInNavigator';

import { BulkEditorWrapper } from './bulk_editor/BulkEditorWrapper';
import { Preferences } from 'app/widgets/ExtensionSDKs/createEditorApi';

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
      return <AssetEditor {...editorProps} />;
    case 'Entry':
      return <EntryEditor {...editorProps} currentSlideLevel={slideStates.length} />;
    case 'BulkEditor':
      return <BulkEditorWrapper slide={slide} editorData={editorData} />;
    default:
      throw new Error(`Unknown editor type "${type}"`);
  }
};
