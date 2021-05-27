import tokens from '@contentful/forma-36-tokens';
import { css } from 'emotion';

const styles = {
  noteWrapper: css({
    display: 'flex',
    gap: tokens.spacingXs,
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
