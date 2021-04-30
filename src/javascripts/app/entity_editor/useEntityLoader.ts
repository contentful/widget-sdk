import { useEffect, useRef, useState } from 'react';
import { loadAsset, loadEntry } from './DataLoader';
import { createLoadEventTracker } from './LoadEventTracker';
import * as Telemetry from 'i13n/Telemetry';
import noop from 'lodash/noop';
import * as random from 'utils/Random';
import { LoadingError, Slide, SlideInEditorType, SlideState } from './SlideInEditor/types';
import { EditorData } from './EntityField/types';
import { getSpaceContext } from 'classes/spaceContext';

const entityLoaders = {
  Entry: loadEntry,
  BulkEditor: loadEntry,
  Asset: loadAsset,
};

const useTrackLoadEvent = ({
  slide,
  getEditorData,
  getSlideStates,
}: {
  slide: Slide;
  getEditorData: () => EditorData | null;
  getSlideStates: () => SlideState[];
}): [number, Function] => {
  const { current: loadStartMs } = useRef(Date.now());
  const { current: trackLoadEvent } = useRef(
    slide.type === 'Entry'
      ? createLoadEventTracker({
          loadStartMs,
          getSlideStates,
          getEditorData,
          slide,
          slidesControllerUuid: random.id(),
        })
      : noop
  );
  return [loadStartMs, trackLoadEvent];
};

const ENTITY_EDITOR_HTTP_TIME_EVENTS = {
  Entry: 'entry_editor_http_time',
  BulkEditor: 'entry_editor_http_time',
  Asset: 'asset_editor_http_time',
};

const recordEntityEditorLoadTime = (entityType: SlideInEditorType, loadStartMs: number) => {
  const loadTimeMs = Date.now() - loadStartMs;
  Telemetry.record(ENTITY_EDITOR_HTTP_TIME_EVENTS[entityType], loadTimeMs);
};

export const useEntityLoader = (
  slide: Slide,
  slideStates: SlideState[]
): [
  { editorData: Record<string, unknown> | null; loadingError: LoadingError | null },
  Function
] => {
  const data: { current: EditorData | null } = useRef(null);
  const [editorData, setEditorData] = useState(null as EditorData | null);
  const [loadingError, setLoadingError] = useState(null as LoadingError | null);

  const [loadStartMs, trackLoadEvent] = useTrackLoadEvent({
    slide,
    getEditorData: () => data.current,
    getSlideStates: () => slideStates,
  });

  useEffect(() => {
    const load = async () => {
      trackLoadEvent('init');
      try {
        const { type, id, path } = slide;
        const spaceContext = getSpaceContext();
        const loadEntity = entityLoaders[type];
        data.current = await loadEntity(spaceContext, type === 'BulkEditor' ? path[0] : id);
        trackLoadEvent('entity_loaded');
        recordEntityEditorLoadTime(type, loadStartMs);
        setEditorData(data.current);
      } catch (error) {
        setLoadingError(error);
      }
    };
    load();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return [{ editorData, loadingError }, trackLoadEvent];
};
