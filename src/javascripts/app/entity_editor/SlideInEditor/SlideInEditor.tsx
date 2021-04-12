import * as React from 'react';
import { SlideIn } from './SlideIn';
import { EntityEditor } from '../EntityEditor';
import { track } from 'analytics/Analytics';

import {
  getSlideInEntities,
  goToSlideInEntity,
  getSlideAsString,
  onSlideStateChanged,
} from 'navigation/SlideInNavigator';
import { Slide, SlideState } from './types';
import { CurrentSpaceAPIClientProvider } from 'core/services/APIClient/CurrentSpaceAPIClientContext';

export const SlideInEditor: React.FunctionComponent<SlideInEditorProps> = (props) => {
  const { fields, fieldController } = props;

  const [slides, setSlides] = React.useState(getSlideInEntities(props));

  const enrichSlideStates = React.useCallback(
    (currentSlides: Slide[], previousSlides: SlideState[] = []) => {
      return currentSlides.map((slide) => {
        const key = getSlideAsString(slide);
        const previousSlide = previousSlides.find((previousSlide) => previousSlide.key === key);
        return {
          key,
          slide,
          viewProps: previousSlide?.viewProps || null,
          loadingError: previousSlide?.loadingError || null,
        };
      });
    },
    []
  );

  const slideStates = React.useRef(enrichSlideStates(slides));

  const updateSlides = React.useCallback(
    (params) => {
      const newSlides = getSlideInEntities(params);
      slideStates.current = enrichSlideStates(newSlides, slideStates.current);
      setSlides(newSlides);
    },
    [slideStates, enrichSlideStates]
  );

  React.useEffect(() => onSlideStateChanged(updateSlides), [updateSlides]);

  const updateSlideStateByKey = (key, newState) => {
    slideStates.current = slideStates.current.map((slideState) => {
      if (slideState.key === key) {
        return { ...slideState, ...newState };
      }
      return slideState;
    });
  };

  const onLayerClick = (i, _, peekHoverTimeMs) => {
    const slide = slides[i];
    const eventData = goToSlideInEntity(slide);
    track('slide_in_editor:peek_click', {
      peekHoverTimeMs: Math.max(0, peekHoverTimeMs),
      ...eventData,
    });
  };

  return (
    <CurrentSpaceAPIClientProvider>
      <SlideIn currentSlideClassName="workbench-layer--is-current" onLayerClick={onLayerClick}>
        {slides.map((slide, i) => (
          <EntityEditor
            key={getSlideAsString(slide)}
            slide={slide}
            hasInitialFocus={i + 1 === slides.length}
            updateSlideStateByKey={updateSlideStateByKey}
            slideStates={slideStates.current}
            fields={fields}
            fieldController={fieldController}
          />
        ))}
      </SlideIn>
    </CurrentSpaceAPIClientProvider>
  );
};

interface SlideInEditorEntityProps {
  previousEntries?: string;
  spaceId: string;
  fieldController?: object;
  fields?: object;
}

interface SlideInEditorBulkProps extends SlideInEditorEntityProps {
  entryId: string;
  assetId: never;
  bulkEditor: string;
}

interface SlideInEditorEntryProps extends SlideInEditorEntityProps {
  entryId: string;
  assetId: never;
  bulkEditor: undefined;
}

interface SlideInEditorAssetProps extends SlideInEditorEntityProps {
  entryId: never;
  assetId: string;
  bulkEditor: never;
}

export type SlideInEditorProps =
  | SlideInEditorEntryProps
  | SlideInEditorAssetProps
  | SlideInEditorBulkProps;
