import React, { useReducer, useEffect, useRef, ReactElement } from 'react';
import { css } from 'emotion';
import cn from 'classnames';

import tokens from '@contentful/forma-36-tokens';
import { IconButton } from '@contentful/forma-36-react-components';
import { ProgressBar } from './ProgressBar';
import FullScreen from 'components/shared/stack-onboarding/components/FullScreen';

const initialState = {
  numSlides: 0,
  currentSlide: 0,
  slides: [],
};

enum actions {
  NEXT = 'NEXT',
  PREV = 'PREV',
  GOTO = 'GOTO',
  REGISTER = 'REGISTER',
}

const reducer = (state, action) => {
  switch (action.type) {
    case actions.NEXT: {
      const currentSlide = Math.min(state.currentSlide + 1, state.numSlides - 1);
      return {
        ...state,
        currentSlide,
      };
    }
    case actions.PREV: {
      const currentSlide = Math.max(state.currentSlide - 1, 0);
      return {
        ...state,
        currentSlide,
      };
    }
    case actions.GOTO: {
      const currentSlide = action.payload;
      return {
        ...state,
        currentSlide,
      };
    }
    case actions.REGISTER: {
      const numSlides = action.payload;
      const currentSlide = 0;
      const nextSlide = Math.min(currentSlide + 1, numSlides);
      const prevSlide = 0;
      return {
        ...state,
        numSlides,
        currentSlide,
        prevSlide,
        nextSlide,
      };
    }
    default: {
      return state;
    }
  }
};

export const NewsSliderContext = React.createContext<{
  onNext?: () => void;
  onPrev?: () => void;
}>({});

// 148px is the size of the slider's header + its margin + padding around slide container
const sliderHeaderHeight = '148px';

const styles = {
  slider: css({
    display: 'flex',
    flexDirection: 'column',
  }),
  slidesContainer: css({
    display: 'flex',
    overflow: 'hidden',
    scrollBehavior: 'smooth',
    height: `calc(100vh - ${sliderHeaderHeight})`,
    '@media screen and (max-height: 700px)': {
      height: 'auto',
    },
  }),
  slide: css({
    width: '100%',
    height: '100%',
    flexShrink: 0,
    textAlign: 'left',
  }),
  closeButton: css({
    fontSize: tokens.fontSizeL,
  }),
};

interface NewsSliderProps {
  onClose: () => void;
  children: Array<ReactElement>;
}

export const NewsSlider = ({ children, onClose }: NewsSliderProps) => {
  const [state, dispatch] = useReducer(reducer, initialState);

  const listRef = useRef<HTMLDivElement>(null);

  const onNext = () => dispatch({ type: 'NEXT' });
  const onPrev = () => dispatch({ type: 'PREV' });
  const goTo = (index) => dispatch({ type: 'GOTO', payload: index });

  useEffect(() => {
    dispatch({ type: 'REGISTER', payload: children?.length });
  }, [children]);

  useEffect(() => {
    const slides = listRef?.current?.children;
    const currentSlideElement = slides?.length && slides[state.currentSlide];
    if (currentSlideElement) {
      currentSlideElement.scrollIntoView();
    }
  }, [state.currentSlide]);

  return (
    <NewsSliderContext.Provider value={{ onNext, onPrev }}>
      <FullScreen
        backgroundColor="white"
        progressBar={
          <ProgressBar current={state.currentSlide} total={state.numSlides} goTo={goTo} />
        }
        close={
          <IconButton
            buttonType="secondary"
            iconProps={{ icon: 'Close', size: 'large' }}
            onClick={onClose}
            data-test-id="close-news-slider"
            className={styles.closeButton}>
            Close
          </IconButton>
        }>
        <div className={styles.slidesContainer} ref={listRef}>
          {children.map((slide, index) => (
            <div
              className={cn(styles.slide, { slideActive: index === state.currentSlide })}
              key={index}
              data-test-id="news-slider-slide"
              data-active={index === state.currentSlide}>
              {slide}
            </div>
          ))}
        </div>
      </FullScreen>
    </NewsSliderContext.Provider>
  );
};
