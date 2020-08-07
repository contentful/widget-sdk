import { css, keyframes } from 'emotion';
import tokens from '@contentful/forma-36-tokens';

const slideInFromRight = keyframes({
  from: {
    right: '-100px',
    width: '0',
    minWidth: '0',
  },
  to: {
    width: '360px',
    minWidth: '360px',
    right: '0',
  },
});

const slideOutToRight = keyframes({
  from: {
    width: '360px',
    minWidth: '360px',
    right: '0',
  },
  to: {
    right: '-100px',
    width: '0',
    minWidth: '0',
  },
});

const fadeIn = keyframes({
  from: {
    filter: 'alpha(opacity=0)',
  },
  to: {
    filter: 'none',
  },
});

const fadeOut = keyframes({
  from: {
    filter: 'none',
  },
  to: {
    filter: 'alpha(opacity=0)',
  },
});

export const styles = {
  mainContent: css({
    padding: 0,
    '& > div': {
      height: '100%',
      minHeight: '100%',
      maxWidth: '100%',
    },
  }),
  sidebar: css({
    boxShadow: '1px 0 4px 0 rgba(0, 0, 0, 0.9)',
    padding: '0',
  }),
  referenceSideBar: css({
    position: 'absolute',
    zIndex: '1',
    height: '100%',
    width: '0',
    minWidth: '0',
    visibility: 'hidden',
  }),
  entrySideBar: css({
    height: '100%',
  }),
  sidebarSlideIn: css({
    animation: `500ms ease-in-out ${slideInFromRight}, 200ms ease-in-out ${fadeIn}`,
    overflow: 'auto',
    width: '360px',
    minWidth: '360px',
    visibility: 'visible',
  }),
  sideBarSlideOut: css({
    animation: `500ms ease-in-out ${slideOutToRight}, 200ms ease-in-out ${fadeOut}`,
    width: '0',
    minWidth: '0',
    overflow: 'hidden',
    visibility: 'visible',
  }),
  tabs: css({
    display: 'flex',
    paddingLeft: tokens.spacing2Xl,
  }),
  tab: css({
    alignItems: 'center',
    display: 'flex',
    textAlign: 'center',
  }),
  tabIcon: css({
    marginRight: tokens.spacing2Xs,
    marginLeft: tokens.spacing2Xs,
  }),
  tabPanel: css({
    display: 'none',
    height: '100%',
    maxHeight: 'calc(100% - 56px)',
    overflowY: 'scroll',
  }),
  isVisible: css({
    display: 'block',
  }),
  promotionTag: css({
    padding: '3px 5px',
    fontSize: '10px',
    lineHeight: '10px',
    letterSpacing: '0.5px',
    fontWeight: tokens.fontWeightMedium,
    borderRadius: '3px',
    backgroundColor: tokens.colorBlueDark,
    marginLeft: tokens.spacingXs,
    color: `${tokens.colorWhite} !important`,
    textTransform: 'uppercase',
  }),
};
