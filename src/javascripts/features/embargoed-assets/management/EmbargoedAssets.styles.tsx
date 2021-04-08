import { css } from 'emotion';
import tokens from '@contentful/forma-36-tokens';

export const styles = {
  section: css({
    margin: `${tokens.spacingL} auto`,
    padding: tokens.spacingXl,
  }),
  largeMarginBottom: css({
    marginBottom: tokens.spacingL,
  }),
  lockIcon: css({
    verticalAlign: 'middle',
  }),
  table: css({
    marginBottom: tokens.spacingL,
    tableLayout: 'fixed',
  }),
  tableFirstCol: css({
    width: '33%',
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
  bolder: css({
    fontWeight: 'bolder',
  }),
};
