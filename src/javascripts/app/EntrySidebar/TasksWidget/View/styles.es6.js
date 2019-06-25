import { css } from 'emotion';
import tokens from '@contentful/forma-36-tokens';

export const taskListStyles = {
  list: css({
    border: `1px solid ${tokens.colorElementMid}`,
    borderBottom: '0'
  }),
  listItem: css({
    marginBottom: '0'
  }),
  addTaskCta: css({
    marginTop: tokens.spacingS
  }),
  loadingSkeletonContainer: css({
    margin: '18px 0 10px'
  })
};

export const taskStyles = {
  task: css({
    display: 'flex',
    cursor: 'pointer',
    alignItems: 'start',
    backgroundColor: tokens.colorWhite,
    borderBottom: `1px solid ${tokens.colorElementMid}`,
    transition: `background-color ${tokens.transitionDurationShort} ${tokens.transitionEasingDefault}`,
    outline: 'none',
    ':hover': {
      backgroundColor: tokens.colorElementLight
    },
    ':focus': {
      backgroundColor: tokens.colorElementLight,
      outline: `1px solid ${tokens.colorPrimary}`,
      borderRadius: '2px',
      boxShadow: tokens.glowPrimary
    }
  }),

  taskLoading: css({
    padding: tokens.spacingS,
    cursor: 'default',
    ':hover': {
      backgroundColor: tokens.colorWhite
    },
    ':focus': {
      backgroundColor: tokens.colorWhite,
      outline: 'none',
      borderRadius: 0,
      boxShadow: 'none'
    }
  }),

  taskHasEditForm: css({
    cursor: 'default',
    ':hover': {
      backgroundColor: tokens.colorWhite
    },
    ':focus': {
      backgroundColor: tokens.colorWhite,
      outline: 'none',
      borderRadius: 0,
      boxShadow: 'none'
    }
  }),

  body: css({
    flex: '1 1 0',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    padding: tokens.spacingS
  }),

  checkboxWrapper: css({
    padding: tokens.spacingS,
    paddingRight: 0
  }),

  avatarWrapper: css({
    display: 'inline-flex',
    padding: tokens.spacingS,
    paddingLeft: 0,
    alignItems: 'flex-start'
  }),

  bodyExpanded: css({
    textOverflow: 'clip',
    whiteSpace: 'pre-line',
    wordWrap: 'break-word',
    overflow: 'hidden'
  }),

  meta: css({
    marginTop: tokens.spacingXs,
    color: tokens.colorTextMid,
    lineHeight: tokens.lineHeightDefault,
    fontSize: tokens.fontSizeS
  }),

  avatar: css({
    display: 'block',
    width: '18px',
    height: '18px',
    background: tokens.colorElementLight,
    borderRadius: '100%'
  }),

  actions: css({
    display: 'inline-block',
    marginLeft: 0,
    width: 0,
    height: '18px',
    overflow: 'hidden',
    transition: `width ${tokens.transitionDurationShort} ${tokens.transitionEasingDefault}, margin-left ${tokens.transitionDurationShort} ${tokens.transitionEasingDefault}`
  }),

  actionsVisible: css({
    marginLeft: tokens.spacingXs,
    width: '18px'
  }),

  editForm: css({
    width: '100%',
    padding: tokens.spacingS
  }),

  editActions: css({
    display: 'flex'
  }),

  editTaskLink: css({
    marginRight: tokens.spacingS
  }),

  editSubmit: css({
    marginRight: tokens.spacingS
  }),

  tabFocusTrap: css({
    width: '100%'
  })
};
