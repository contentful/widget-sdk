import { css } from 'emotion';
import tokens from '@contentful/forma-36-tokens';

export default {
  heading: css({
    padding: tokens.spacingM
  }),
  list: css({
    '> *': {
      padding: tokens.spacingM,
      paddingLeft: 0
    }
  }),
  denseList: css({
    '> *': {
      padding: tokens.spacingXs,
      paddingLeft: 0
    }
  }),
  listItem: css({
    display: 'flex',
    ':hover': {
      background: tokens.colorElementLightest
    }
  }),
  card: css({
    display: 'inline-block',
    minWidth: '20rem',
    padding: `0 0 ${tokens.spacingM} 0`,
    '> *': {
      paddingLeft: tokens.spacingM,
      paddingRight: tokens.spacingM
    }
  })
};
