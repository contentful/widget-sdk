import { css } from 'emotion';
import tokens from '@contentful/forma-36-tokens';
import ellipsisStyle from 'ellipsisStyle.es6';

const columnMaxWidth = '350px';

export default {
  contentAlignment: css({
    display: 'flex',
    alignItems: 'center',
    flexDirection: 'column',
    paddingTop: 0
  }),
  content: css({
    maxWidth: tokens.contentWidthDefault,
    padding: tokens.spacingXl
  }),
  row: css({
    height: '95px'
  }),
  cell: css({
    paddingRight: tokens.spacing3Xl
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
    minWidth: '520px',
    maxWidth: '520px',
    overflowX: 'hidden',
    textOverflow: 'ellipsis',
    lineHeight: '1.2em'
  }),
  roleEditorButton: css({
    minWidth: '300px',
    maxWidth: '300px',
    marginRight: tokens.spacingM
  }),
  roleForm: css({
    display: 'flex',
    justifyContent: 'flex-end'
  }),
  strong: css({
    color: tokens.colorTextMid
  })
};
