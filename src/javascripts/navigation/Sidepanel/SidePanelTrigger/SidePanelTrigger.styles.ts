import { css } from 'emotion';
import tokens from '@contentful/forma-36-tokens';

export const styles = {
  root: css({
    position: 'relative',
    alignItems: 'center',
    boxShadow: `inset -1px 0 2px 0 rgba(0,0,0,0.4), inset -2px 0 5px 0 rgba(0,0,0,0.35)`,
    backgroundColor: tokens.colorContrastMid,
    display: 'flex',
    flexGrow: 1,
    padding: `0 ${tokens.spacingM} 0 ${tokens.spacingM}`,
    textAlign: 'left',
    width: '280px',
    height: '100%',
    cursor: 'pointer',
    transition: `background-color ${tokens.transitionDurationShort} ${tokens.transitionEasingDefault}`,
    '> *': {
      zIndex: 1,
    },
  }),
  content: css({
    display: 'flex',
    flexFlow: 'column',
    flexGrow: 1,
    flexShrink: 1,
    overflow: 'hidden',
    textAlign: 'left',
    padding: `0 ${tokens.spacingM} 0 ${tokens.spacingM}`,
    outline: 'none',
  }),
  ellipsis: css({
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    maxWidth: '100%',
  }),
  orgName: css({
    color: tokens.colorBlueLightest,
    display: 'block',
    fontSize: tokens.fontSizeS,
    lineHeight: tokens.lineHeightCondensed,
  }),
  stateTitle: css({
    color: tokens.colorWhite,
    display: 'block',
    fontSize: tokens.fontSizeM,
    fontWeight: tokens.fontWeightNormal,
    lineHeight: tokens.lineHeightDefault,
  }),
  envLabel: css({ fontSize: tokens.fontSizeS }),
  noShrink: css({ display: 'flex', flexShrink: 0 }),
  hoverBackground: css({
    position: 'absolute',
    left: 0,
    top: 0,
    right: 0,
    bottom: 0,
    zIndex: 0,
    backgroundColor: tokens.colorContrastMid,
    // change background on parent hover and sibling button focus
    '*:hover > &, *:focus ~ &': {
      backgroundColor: tokens.colorContrastDark,
    },
  }),
};
