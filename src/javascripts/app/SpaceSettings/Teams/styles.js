import { css } from 'emotion';
import tokens from '@contentful/forma-36-tokens';

export default {
  content: css({
    display: 'flex',
    alignItems: 'center',
    flexDirection: 'column',
    paddingTop: tokens.spacingXl,
  }),
  table: css({
    tableLayout: 'fixed',
  }),
  row: css({
    height: '95px',
  }),
  cell: css({
    paddingRight: tokens.spacing3Xl,
  }),
  teamNameCell: css({
    fontWeight: tokens.fontWeightMedium,
    color: tokens.colorTextDark,
    whiteSpace: 'nowrap',
    overflowX: 'hidden',
    textOverflow: 'ellipsis',
  }),
  teamDescriptionCell: css({
    overflow: 'hidden',
    display: '-webkit-box',
    WebkitLineClamp: '2',
    MozLineClamp: '2',
    WebkitBoxOrient: 'vertical',
  }),
  teamColumn: css({
    width: '39.9%',
  }),
  membersColumn: css({
    width: '13%',
  }),
  rolesColumn: css({
    width: '42%',
  }),
  rolesCell: css({
    overflowX: 'hidden',
    textOverflow: 'ellipsis',
  }),
  roleEditorButton: css({
    minWidth: '300px',
    maxWidth: '300px',
    marginRight: tokens.spacingM,
  }),
  roleForm: css({
    display: 'flex',
    justifyContent: 'flex-end',
  }),
  strong: css({
    color: tokens.colorTextMid,
  }),
  modalContent: css({
    p: {
      marginBottom: tokens.spacingM,
    },
  }),
};
