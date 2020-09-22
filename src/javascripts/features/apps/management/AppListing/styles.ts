import tokens from '@contentful/forma-36-tokens';
import { css } from 'emotion';
import { copyButton } from '../styles';

export const styles = {
  headerActions: css({
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    marginLeft: tokens.spacingXs,
  }),
  headerInput: css({
    maxWidth: '1100px',
    width: '100%',
    marginLeft: tokens.spacing4Xl,
  }),
  appActions: css({
    verticalAlign: 'middle',
  }),
  copyButton,
  sidebarHeading: css({
    color: tokens.colorElementDarkest,
    borderBottom: `1px solid ${tokens.colorElementMid}`,
    fontWeight: tokens.fontWeightNormal,
  }),
  cell: css({
    display: 'flex',
    alignItems: 'center',
    minWidth: '200px',
  }),
  miniIcon: css({
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: tokens.spacingS,
    verticalAlign: 'sub',
  }),
  learnMore: css({
    maxWidth: '768px',
    margin: '0 auto',
    marginTop: '100px',
    textAlign: 'center',
  }),
  emptyWorkbench: css({
    '> div': css({
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      maxWidth: '768px',
      margin: '0 auto',
    }),
  }),
  emptyState: css({
    maxWidth: '768px',
    margin: '0 auto',
    textAlign: 'center',
    marginTop: tokens.spacingL,
    marginBottom: tokens.spacingS,
    '& svg': css({
      width: '80%',
    }),
    button: css({
      marginBottom: tokens.spacingL,
    }),
  }),
  menuCell: css({
    display: 'flex',
    justifyContent: 'flex-end',
    height: '20px',
    div: css({
      display: 'flex',
      justifyContent: 'center',
    }),
  }),
  id: css({
    fontFamily: tokens.fontStackMonospace,
    [`&:hover ~ .${copyButton} button`]: css({
      opacity: '1',
      transform: 'translateX(0)',
    }),
  }),
};
