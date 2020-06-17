import { css } from 'emotion';
import tokens from '@contentful/forma-36-tokens';

const styles = {
  wrapper: css({
    display: 'flex',
    alignItems: 'center',
    transform: `translateX(-${tokens.spacingXs})`,
  }),
  tooltip: css({
    display: 'inline-flex',
  }),
  icon: css({
    marginRight: tokens.spacingXs,
    marginLeft: tokens.spacingXs,
    '& path:last-child': {
      fill: tokens.colorTextMid,
      stroke: tokens.colorTextMid,
    },
  }),
};

export { styles };
