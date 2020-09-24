import { css, keyframes } from 'emotion';
import tokens from '@contentful/forma-36-tokens';

const rendererFadeIn = keyframes({
  from: {
    transform: 'translateY(50px)',
    opacity: '0',
  },
  to: {
    transform: 'translateY(0)',
    opacity: '1',
  },
});

const feedbackButtonFadeIn = keyframes({
  from: {
    transform: 'translateY(75px)',
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
    animation: `${rendererFadeIn} 0.8s ease`,
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
  earlyAccessTag: css({
    marginLeft: tokens.spacingXs,
  }),
  divider: css({
    height: '1px',
    maxHeight: '1px',
    backgroundColor: tokens.colorElementLight,
  }),
  feedbackButton: css({
    position: 'fixed',
    right: '25px',
    bottom: '25px',
    backgroundColor: 'white',
    boxShadow:
      '0 0 0 1px rgba(0,0,0,.05), 0px 15px 35px rgba(0, 0, 0, 0.08), 0px 2px 15px rgba(0, 0, 0, 0.05)',
    animation: `${feedbackButtonFadeIn} 0.2s ${tokens.transitionEasingCubicBezier} 2s backwards`,
  }),
};
