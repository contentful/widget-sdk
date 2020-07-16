import { css } from 'emotion';
import tokens from '@contentful/forma-36-tokens';

export const styles = {
  mainContent: css({
    padding: 0,
    '& > div': {
      height: '100%',
      minHeight: '100%',
      maxWidth: '100%',
    },
  }),
  mainContentListView: css({
    '& > div': {
      overflowY: 'hidden',
    },
  }),
  sidebar: css({
    boxShadow: '1px 0 4px 0 rgba(0, 0, 0, 0.9)',
    width: '360px',
    padding: tokens.spacingM,
  }),
  buttons: css({
    marginTop: tokens.spacingM,
  }),
  errorNote: css({
    display: 'flex',
    justifyContent: 'center',
    width: '50%',
    margin: 'auto',
    marginTop: tokens.spacing4Xl,
  }),
  layoutPillsWrapper: css({
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    cursor: 'pointer',
    width: '70%',
    margin: 'auto',
    marginTop: tokens.spacingXl,
    marginBottom: tokens.spacingM,
  }),
  layoutPills: css({
    pointerEvents: 'none',
    ':focus, :hover': {
      boxShadow: 'none',
    },
    '& select': css({
      width: 'auto !important',
      textAlign: 'center',
      pointerEvents: 'all',
    }),
  }),
  layoutList: css({
    width: '91%',
  }),
  activePill: css({
    backgroundColor: tokens.colorElementDark,
  }),
  header: css({
    display: 'flex',
    alignItems: 'baseline',
    '& h2': css({
      marginRight: tokens.spacingXs,
    }),
  }),
  hideDisplay: css({
    display: 'none',
  }),
};
