import { css } from 'emotion';
import tokens from '@contentful/forma-36-tokens';

export default {
  nameCol: css({
    width: '30%',
  }),
  membersCol: css({
    width: '12%',
  }),
  actionsCol: css({
    width: '60px', // width of the '...' button + padding
  }),

  teamName: css({
    fontWeight: tokens.fontWeightMedium,
    color: tokens.colorTextDark,
    whiteSpace: 'nowrap',
    overflowX: 'hidden',
    textOverflow: 'ellipsis',
    maxWidth: '285px', // we need this otherwise text-overflow won't work
  }),
  teamDescription: css({
    marginTop: tokens.spacingXs,
    overflow: 'hidden',
    display: '-webkit-box',
    WebkitLineClamp: '2',
    MozLineClamp: '2',
    WebkitBoxOrient: 'vertical',
  }),
};
