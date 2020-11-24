import tokens from '@contentful/forma-36-tokens';
import { css } from 'emotion';

export const styles = {
  header: css({
    fontSize: tokens.fontSizeL,
    marginTop: tokens.spacing2Xl,
    marginBottom: tokens.spacingXs,
  }),
  activateButton: css({
    marginTop: tokens.spacingM,
  }),
  copySecretReminder: css({
    marginTop: tokens.spacingM,
    marginBottom: tokens.spacingM,
  }),
  secretInputLabel: css({
    fontSize: tokens.fontSizeM,
    marginTop: tokens.spacingL,
  }),
  inputWrapper: css({
    display: 'flex',
  }),
  currentSecretInput: css({
    flexGrow: 1,
    width: 'auto',
    '& input': {
      fontFamily: tokens.fontStackMonospace,
    },
  }),
  button: css({
    paddingLeft: tokens.spacingXl,
    paddingRight: tokens.spacingXl,
    borderRadius: 0,
    borderLeftWidth: 0,
  }),
  loading: css({
    marginTop: tokens.spacingS,
  }),
};
