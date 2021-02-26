import * as React from 'react';
import { css, cx, keyframes } from 'emotion';
import noop from 'lodash/noop';
import tokens from '@contentful/forma-36-tokens';

const PEEK_IN_DELAY = 500;

const slideInFromRight = keyframes({
  from: {
    transform: 'translate3d(300px, 0, 0)',
  },
  to: {
    transform: 'translate3d(0, 0, 0)',
  },
});

const fadeIn = keyframes({
  from: {
    opacity: 0,
  },
  to: {
    opacity: 1,
  },
});

const styles = {
  wrapper: css({
    position: 'relative',
    width: '100%',
    minHeight: '100%',
  }),
  slide: css({
    position: 'absolute',
    height: '100%',
    zIndex: 10,
    background: tokens.colorWhite,
    boxShadow: '-3px 0px 3px rgba(12,20,28,0.15)',
    willChange: 'width',
    transition: `left 200ms ease-in-out, transform 200ms ease-in-out ${PEEK_IN_DELAY}ms`,
    '&:hover ~ div': {
      transform: 'translate3d(300px, 0, 0)',
    },
  }),
  overlay: css({
    position: 'absolute',
    top: 0,
    left: 0,
    zIndex: 10,
    background: tokens.colorContrastDark,
    width: '100%',
    height: '100%',
    cursor: 'pointer',
    transition: '200ms ease-in-out opacity',
    '&:hover': {
      opacity: '0.1 !important',
    },
  }),
  animatedEnterLeave: css({
    animation: `200ms ease-in-out ${slideInFromRight}, 200ms ease-in-out ${fadeIn}`,
  }),
};

const getTimestamp = (): number => new Date().getTime();
const getPeekHoverTimeMs = (peekStart: number): number =>
  getTimestamp() - peekStart - PEEK_IN_DELAY;

interface SlideInProps {
  onLayerClick?: (index: number, slide: React.Component, peekHoverTimeMs: number) => void;
  currentSlideClassName?: string;
}

export const SlideIn: React.FunctionComponent<SlideInProps> = (props) => {
  const { onLayerClick = noop, currentSlideClassName = '', children: slides } = props;
  const peekStart = React.useRef(0);

  if (!Array.isArray(slides)) {
    throw new Error('Children must be an array of React components');
  }

  return (
    <div className={styles.wrapper} data-test-id="slide-in">
      {slides.map((slide, i) => {
        const offset = (170 / slides.length) * i;
        const wrapperClassName = cx(
          styles.slide,
          css({
            left: `${offset}px`,
            width: `calc(100% - ${offset}px)`,
          }),
          {
            [styles.animatedEnterLeave]: i !== 0,
            [currentSlideClassName]: !!currentSlideClassName && i + 1 === slides.length,
          }
        );
        const overlayClassName = cx(
          styles.overlay,
          css({
            opacity: -i / slides.length + 0.8,
          })
        );
        return (
          <div
            key={`slide-${i}`}
            data-test-id={`slide-in-${i === 0 ? 'base' : 'layer'}`}
            className={wrapperClassName}>
            {slide}
            {i + 1 < slides.length && (
              <div
                className={overlayClassName}
                data-test-id={`slide-in-overlay-${i}`}
                onMouseOver={() => (peekStart.current = getTimestamp())}
                onClick={() => onLayerClick(i, slide, getPeekHoverTimeMs(peekStart.current))}
              />
            )}
          </div>
        );
      })}
    </div>
  );
};
