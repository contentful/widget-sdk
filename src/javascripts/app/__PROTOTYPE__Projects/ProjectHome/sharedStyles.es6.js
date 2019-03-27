import { css } from 'emotion';
import tokens from '@contentful/forma-36-tokens';

export default {
  heading: css({
    marginBottom: tokens.spacingM
  }),
  list: css({
    '> *': {
      marginTop: tokens.spacingM,
      marginBottom: tokens.spacingM
    }
  }),
  denseList: css({
    '> *': {
      marginTop: tokens.spacingXs,
      marginBottom: tokens.spacingXs
    }
  }),
  card: css({
    display: 'inline-block',
    minWidth: '20rem'
  })
};
