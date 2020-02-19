import { css } from 'emotion';
import tokens from '@contentful/forma-36-tokens';

export const entityHyperlinkTooltipStyles = {
  entityContentType: css({
    color: tokens.colorTextLightest,
    marginRight: tokens.spacingXs,
    '&:after': {
      content: '""'
    }
  }),
  entityTitle: css({
    marginRight: tokens.spacingXs
  }),
  separator: css({
    background: tokens.colorTextMid,
    margin: tokens.spacingXs
  })
};

export const inlineEmbedStyles = {
  scheduledIcon: css({
    verticalAlign: 'text-bottom',
    marginRight: tokens.spacing2Xs
  })
};
