import { css } from 'emotion';
import tokens from '@contentful/forma-36-tokens';

export const styles = {
  root: css({
    marginTop: tokens.spacing3Xl,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  }),
  card: css({
    width: '500px',
    border: `1px solid ${tokens.colorElementMid}`,
    boxShadow: tokens.boxShadowDefault,
  }),
  form: css({
    paddingLeft: tokens.spacingL,
    paddingRight: tokens.spacingL,
  }),
  title: css({
    textAlign: 'center',
    marginTop: tokens.spacingL,
    marginBottom: tokens.spacingL,
  }),
  buttonsPanel: css({
    display: 'inline',
    marginTop: tokens.spacingL,
  }),
  button: css({
    marginLeft: tokens.spacingS,
    marginRight: tokens.spacingS,
    width: 120,
  }),
};
