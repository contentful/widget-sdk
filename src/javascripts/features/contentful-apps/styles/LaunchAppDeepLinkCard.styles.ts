import tokens from '@contentful/forma-36-tokens';
import { css } from 'emotion';

const styles = {
  noteWrapper: css({
    display: 'flex',
    gap: tokens.spacingXs,
  }),
  pill: css({
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    width: '3rem',
    padding: `0.1rem ${tokens.spacing2Xs}`,
    textTransform: 'uppercase',
    fontSize: tokens.fontSizeS,
    background: 'linear-gradient(90deg, #5096EF 0%, #38C29B 100%)',
    color: tokens.colorWhite,
    textAlign: 'center',
    borderRadius: '3px',
    letterSpacing: tokens.letterSpacingWide,
    textIndent: tokens.letterSpacingWide,
    fontWeight: tokens.fontWeightMedium,
  }),
  textLink: css({
    color: tokens.colorTextLight,
    '&:hover, &:active, &:visited': {
      color: tokens.colorTextLight,
    },
    '&:link': {
      textDecoration: 'underline',
      fontWeight: tokens.fontWeightNormal,
    },
  }),
};

export { styles };
