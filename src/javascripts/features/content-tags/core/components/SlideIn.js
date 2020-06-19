import { css } from 'emotion';
import tokens from '@contentful/forma-36-tokens';
import React, { useCallback, useRef, useState } from 'react';
import PropTypes from 'prop-types';

const styles = {
  slideIn: css({
    top: '70px',
    right: '0',
    position: 'fixed',
    height: '100%',
    width: '835px',
    backgroundColor: tokens.colorWhite,
    zIndex: tokens.zIndexModal,
    borderLeft: `1px solid ${tokens.colorElementDarkest}`,
    boxShadow: tokens.boxShadowDefault,
  }),
  blocker: css({
    top: '0',
    right: '0',
    position: 'fixed',
    height: '100%',
    width: '100%',
    backgroundColor: `${tokens.colorContrastDark}32`,
  }),
};

const SlideIn = ({ isShown, children, onClose }) => {
  const [isShownState, setIsShownState] = useState(isShown);
  const blockerRef = useRef();

  const close = useCallback(() => {
    if (onClose) {
      onClose();
    } else {
      setIsShownState(false);
    }
  }, [onClose, setIsShownState]);

  const onBlockerClick = useCallback(
    (event) => {
      if (event.target === blockerRef.current) {
        close();
      }
    },
    [blockerRef, close]
  );

  if (!isShownState) return null;

  return (
    <div className={styles.blocker} ref={blockerRef} onClick={onBlockerClick}>
      <div className={styles.slideIn}>{children}</div>
    </div>
  );
};

SlideIn.propTypes = {
  isShown: PropTypes.bool,
  children: PropTypes.node,
  onClose: PropTypes.func,
};

export { SlideIn };
