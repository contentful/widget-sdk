import { css } from 'emotion';
import tokens from '@contentful/forma-36-tokens';

export default {
  info: css`
    color: ${tokens.colorTextLight};
    margin-bottom: ${tokens.spacingS};
  `,
  button: css`
    margin-bottom: ${tokens.spacingS};
  `,
  header: css`
    display: flex;
    margin-bottom: ${tokens.spacingS};
  `,
  alphaLabel: css`
    display: block;
    margin-right: ${tokens.spacingS};
    background: ${tokens.colorBlueDark};
    color: ${tokens.colorWhite};
    padding: ${tokens.spacing2Xs};
    font-size: 0.65rem;
    line-height: 0.65rem;
    border-radius: 3px;
    text-transform: uppercase;
  `
};
