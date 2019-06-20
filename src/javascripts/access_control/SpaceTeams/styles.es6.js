import { css } from 'emotion';
import tokens from '@contentful/forma-36-tokens';
import ellipsisStyle from 'ellipsisStyle.es6';

const columnMaxWidth = '350px';

export default {
  contentAlignment: css({
    display: 'flex',
    alignItems: 'center',
    flexDirection: 'column',
    marginTop: tokens.spacingXl
  }),
  content: css({
    width: '100%',
    paddingRight: tokens.spacing2Xl,
    paddingLeft: tokens.spacing2Xl
  }),
  row: css({
    height: '95px'
  }),
  rolesColumn: css({
    width: '30%'
  }),
  cell: css({
    paddingRight: '140px'
  }),
  cellTeamName: css({
    fontWeight: tokens.fontWeightMedium,
    color: tokens.colorTextDark,
    maxWidth: columnMaxWidth,
    whiteSpace: 'nowrap',
    ...ellipsisStyle
  }),
  cellTeamDescription: css({
    maxWidth: columnMaxWidth,
    overflow: 'hidden',
    display: '-webkit-box',
    WebkitLineClamp: '2',
    MozLineClamp: '2',
    WebkitBoxOrient: 'vertical'
  }),
  cellRoles: css({
    maxWidth: columnMaxWidth,
    overflowX: 'hidden',
    textOverflow: 'ellipsis',
    lineHeight: '1.2em'
  })
};
