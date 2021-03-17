import { css } from 'emotion';
import tokens from '@contentful/forma-36-tokens';

export const styles = {
  section: css({
    maxWidth: '600px',
    margin: `${tokens.spacingL} auto`,
    padding: tokens.spacingXl,
  }),
  sectionWide: css({
    maxWidth: '768px',
    margin: `${tokens.spacingL} auto`,
    padding: tokens.spacingXl,
  }),
  table: css({
    marginBottom: tokens.spacingL,
  }),
  centered: css({
    textAlign: 'center',
  }),
  marginRight: css({
    marginRight: tokens.spacingM,
  }),
  dialogSmall: css({
    minWidth: '550px',
  }),
  strike: css({
    textDecoration: 'line-through',
  }),
};
