import { css, keyframes } from 'emotion';
import tokens from '@contentful/forma-36-tokens';

const fadeIn = keyframes({
  from: {
    transform: 'translateY(50px)',
    opacity: '0',
  },
  to: {
    transform: 'translateY(0)',
    opacity: '1',
  },
});

export const styles = {
  renderer: css({
    padding: 0,
    animation: `${fadeIn} 0.8s ease`,
    '> div': {
      height: '100%',
      width: '100%',
    },
    overflow: 'hidden',
    height: '100%',
  }),
  hideRenderer: css({
    display: 'none',
  }),
  actionButton: css({
    marginLeft: tokens.spacingM,
  }),
  overlay: css({
    backgroundColor: 'rgba(255, 255, 255, 0.75)',
    position: 'fixed',
    zIndex: 9999,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    textAlign: 'center',
  }),
  busyText: css({
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    padding: '12px',
    borderRadius: '50px',
    fontSize: '24px',
    backgroundColor: 'white',
    letterSpacing: '1px',
  }),
  overlayPill: css({
    width: '100%',
    height: '100%',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
  }),
  spinner: css({
    marginRight: tokens.spacingS,
  }),
  stillLoadingText: css({
    marginTop: '-80px',
  }),
  heading: css({
    display: 'flex',
    alignItems: 'center',
  }),
  tag: css({
    marginLeft: tokens.spacingS,
  }),
  noConfigContainer: css({
    height: '100%',
    width: '100%',
    backgroundColor: tokens.colorElementLightest,
    '> div:nth-child(3)': {
      paddingTop: tokens.spacingL,
    },
  }),
  noConfigSection: css({
    maxWidth: '768px',
    margin: '0 auto',
    padding: tokens.spacingXl,
  }),
  noConfigHelpText: css({
    marginTop: tokens.spacingL,
  }),
  divider: css({
    height: '1px',
    maxHeight: '1px',
    backgroundColor: tokens.colorElementLight,
  }),
};
