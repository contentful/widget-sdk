import { css } from 'emotion';
import tokens from '@contentful/forma-36-tokens';

export const styles = {
  root: css({
    alignItems: 'center',
    boxShadow: `inset -1px 0 2px 0 rgba(0,0,0,0.4), inset -2px 0 5px 0 rgba(0,0,0,0.35)`,
    backgroundColor: tokens.colorContrastMid,
    display: 'flex',
    padding: `0 ${tokens.spacingM}`,
    textAlign: 'left',
    transition: `background-color ${tokens.transitionDurationShort} ${tokens.transitionEasingDefault}`,
    minWidth: '280px',
    '&:hover, &:focus': {
      backgroundColor: tokens.colorContrastDark,
    },
  }),
  content: css({
    display: 'flex',
    flexFlow: 'column',
    flexGrow: 1,
    padding: `0 ${tokens.spacingM}`,
  }),
  ellipsis: css({
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
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
};
