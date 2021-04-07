import tokens from '@contentful/forma-36-tokens';
import { css } from 'emotion';
import { copyButton } from '../styles';

export const styles = {
  title: css({
    display: 'flex',
    alignItems: 'center',
    paddingBottom: tokens.spacingL,
    borderBottom: `1px solid ${tokens.colorElementLight}`,
    '& div:first-child': css({
      marginRight: tokens.spacingL,
    }),
    '& div:last-child h1': css({
      marginBottom: tokens.spacingXs,
    }),
  }),
  workbenchContent: css({
    maxWidth: '820px',
    margin: 'auto',
  }),
  copyButton,
  info: css({
    padding: `${tokens.spacingL} 0`,
    '& p:first-child': css({
      marginBottom: tokens.spacing2Xs,
    }),
    '& p b': css({
      color: tokens.colorTextMid,
      marginRight: tokens.spacing2Xs,
    }),
  }),
  tabPanel: css({
    padding: `${tokens.spacingL} 0`,
    marginBottom: tokens.spacing4Xl,
  }),
  creatorMissing: css({
    opacity: 0,
  }),
  creator: css({
    transition: 'opacity .2s ease',
  }),
  sysId: css({
    display: 'flex',
    flexDirection: 'row',
    '& p': css({
      fontFamily: tokens.fontStackMonospace,
      fontSize: tokens.fontSizeS,
      color: tokens.colorTextMid,
    }),
    [`&:hover .${copyButton} button`]: css({
      opacity: '1',
      transform: 'translateX(0)',
    }),
  }),
  validationErrorIcon: css({
    marginLeft: tokens.spacing2Xs,
  }),
  hostingTag: css({
    marginLeft: tokens.spacingXs,
  }),
};
