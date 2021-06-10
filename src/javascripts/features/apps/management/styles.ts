import tokens from '@contentful/forma-36-tokens';
import { css } from 'emotion';

export const copyButton = css({
  button: css({
    height: '20px',
    border: 'none',
    backgroundColor: 'transparent',
    transform: 'translateX(-10px)',
    opacity: '0',
    transition: `all ${tokens.transitionDurationDefault} ${tokens.transitionEasingCubicBezier}`,
    '&:hover': css({
      backgroundColor: 'transparent',
      border: 'none',
      opacity: '1',
      transform: 'translateX(0)',
    }),
  }),
});

export const headerActions = css({
  ['> *']: {
    marginLeft: '1em',
  },
});
