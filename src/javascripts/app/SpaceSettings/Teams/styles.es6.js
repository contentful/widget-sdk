import { css } from 'emotion';
import tokens from '@contentful/forma-36-tokens';
import ellipsisStyle from 'ellipsisStyle.es6';

export default {
  contentAlignment: css({
    display: 'flex',
    alignItems: 'center',
    flexDirection: 'column',
    paddingTop: 0
  }),
  content: css({
    minWidth: tokens.contentWidthDefault,
    maxWidth: tokens.contentWidthDefault,
    padding: tokens.spacingXl
  }),
  row: css({
    height: '95px'
  }),
  cell: css({
    paddingRight: tokens.spacing3Xl
  }),
  teamCell: css({
    width: '438px'
  }),
  teamNameCell: css({
    fontWeight: tokens.fontWeightMedium,
    color: tokens.colorTextDark,
    whiteSpace: 'nowrap',
    ...ellipsisStyle
  }),
  teamDescriptionCell: css({
    overflow: 'hidden',
    display: '-webkit-box',
    WebkitLineClamp: '2',
    MozLineClamp: '2',
    WebkitBoxOrient: 'vertical'
  }),
  membersCell: css({
    width: '245px'
  }),
  rolesCell: css({
    width: '575px',
    overflowX: 'hidden',
    textOverflow: 'ellipsis',
    lineHeight: '1.2em'
  }),
  roleEditorButton: css({
    minWidth: '300px',
    maxWidth: '300px',
    marginRight: tokens.spacingM
  }),
  roleFormCell: css({
    width: '511px'
  }),
  roleForm: css({
    display: 'flex',
    justifyContent: 'flex-end'
  }),
  strong: css({
    color: tokens.colorTextMid
  }),
  modalContent: css({
    p: {
      marginBottom: tokens.spacingM
    }
  })
};
