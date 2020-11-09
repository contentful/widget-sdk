import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import { ModalLauncher } from '@contentful/forma-36-react-components/dist/alpha';
import {
  ModalConfirm,
  Icon,
  Tooltip,
  Paragraph,
  CardActions,
  DropdownList,
  DropdownListItem,
} from '@contentful/forma-36-react-components';
import { assign } from 'utils/Collections';
import { openRoleSelector } from './RoleSelector';
import { openInputDialog } from 'app/InputDialogComponent';
import { htmlEncode } from 'utils/encoder';
import { css } from 'emotion';
import tokens from '@contentful/forma-36-tokens';
import { savedViewsActionsPropTypes } from './useSavedViews';

const actions = css({
  marginLeft: 'auto',
  visibility: 'hidden',
  pointerEvents: 'none',
  flex: '0 0 auto',
});

const closeActionIconSize = tokens.fontSizeXl;

const styles = {
  folder: css({
    display: 'flex',
    position: 'relative',
    maxWidth: '100%',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTop: `1px solid ${tokens.colorElementLight}`,
    padding: tokens.spacingS,
    [`&:hover .${actions}`]: {
      visibility: 'visible',
      pointerEvents: 'all',
    },
  }),
  active: css({
    borderRadius: '3px',
    backgroundColor: tokens.colorElementLight,
    fontWeight: tokens.fontWeightDemiBold,
  }),
  draggable: css({
    cursor: ['move', '-webkit-grab'],
  }),
  headerTitle: css({
    overflow: 'hidden',
    wordWrap: 'break-word',
    display: 'flex',
    alignItems: 'center',
    '& p': {
      whiteSpace: 'nowrap',
      textOverflow: 'ellipsis',
      overflow: 'hidden',
      letterSpacing: '1px',
      textTransform: 'uppercase',
      fontSize: tokens.fontSizeS,
      fontWeight: tokens.fontWeightDemiBold,
      color: tokens.colorTextDark,
    },
  }),
  view: css({
    display: 'flex',
    justifyContent: 'space-between',
    position: 'relative',
    maxWidth: '100%',
    padding: `${tokens.spacingS} ${tokens.spacingS} ${tokens.spacingS} calc(${tokens.spacingL} + ${closeActionIconSize})`,
    cursor: 'pointer',
    '&:hover': {
      backgroundColor: tokens.colorElementMid,
    },
    [`&:hover .${actions}`]: {
      visibility: 'visible',
      pointerEvents: 'all',
    },
    '& > p': {
      flex: '1 1 auto',
      whiteSpace: 'nowrap',
      textOverflow: 'ellipsis',
      overflow: 'hidden',
    },
  }),
  modalHighlight: css({
    color: tokens.colorTextDark,
    fontWeight: tokens.fontWeightDemiBold,
  }),
  folderCloseActionIcon: css({
    height: closeActionIconSize,
    width: closeActionIconSize,
    marginRight: tokens.spacingS,
    cursor: 'pointer',
    '&:hover': {
      fill: tokens.colorTextDark,
    },
    fill: tokens.colorTextLight,
    transition: 'transform 0.15s ease-in-out',
    flex: '1 0 auto',
  }),
  folderClosedIcon: css({
    transform: 'rotate(-90deg)',
  }),
  actions,
};

const ShareItem = ({ view, roleAssignment, trackingForScopedViews, updateScopedFolderView }) => {
  if (!roleAssignment) return null;

  const updateView = async () => {
    const roles = await openRoleSelector(roleAssignment.endpoint, view.roles);
    if (roles !== false) {
      const updatedView = {
        ...view,
        roles,
      };
      trackingForScopedViews.viewRolesEdited(view);
      updateScopedFolderView(updatedView);
    }
  };

  return <DropdownListItem onClick={updateView}>Share</DropdownListItem>;
};

ShareItem.propTypes = {
  view: PropTypes.object.isRequired,
  roleAssignment: PropTypes.object,
  trackingForScopedViews: PropTypes.object.isRequired,
  updateScopedFolderView: PropTypes.func.isRequired,
};

export const View = ({
  testId,
  view,
  isFolderClosed,
  currentViewId,
  onSelectSavedView,
  savedViewsActions,
  onMouseOver,
}) => {
  const {
    updateScopedFolderView,
    deleteScopedFolderView,
    getRoleAssignment,
    trackingForScopedViews,
    canEditScopedFolders,
  } = savedViewsActions;
  const roleAssignment = getRoleAssignment();
  const canEdit = canEditScopedFolders();

  if (isFolderClosed) return null;

  return (
    <div
      onMouseOver={onMouseOver}
      className={classNames(styles.view, {
        [styles.active]: view.id === currentViewId,
        [styles.draggable]: canEdit,
      })}>
      <Paragraph testId={testId} onClick={() => onSelectSavedView(view)} title={view.title}>
        {view.title}
      </Paragraph>
      <CardActions className={styles.actions} isDisabled={!canEdit}>
        <DropdownList>
          <ShareItem
            view={view}
            roleAssignment={roleAssignment}
            trackingForScopedViews={trackingForScopedViews}
            updateScopedFolderView={updateScopedFolderView}
          />
          <DropdownListItem
            onClick={() => editViewTitle(view, trackingForScopedViews, updateScopedFolderView)}>
            Rename
          </DropdownListItem>
          <DropdownListItem
            onClick={() => deleteView(view, trackingForScopedViews, deleteScopedFolderView)}>
            Delete
          </DropdownListItem>
        </DropdownList>
      </CardActions>
    </div>
  );
};

View.propTypes = {
  testId: PropTypes.string,
  view: PropTypes.object.isRequired,
  isFolderClosed: PropTypes.bool,
  currentViewId: PropTypes.string.isRequired,
  onMouseOver: PropTypes.func.isRequired,
  onSelectSavedView: PropTypes.func.isRequired,
  savedViewsActions: savedViewsActionsPropTypes.isRequired,
};

export const Folder = ({
  testId,
  folder,
  savedViewsActions,
  onClick,
  isFolderClosed,
  isHidden,
  onMouseOver,
}) => {
  const { updateScopedFolder, deleteScopedFolder, canEditScopedFolders } = savedViewsActions;

  const canEdit = canEditScopedFolders();

  // Do not render anything when:
  // - all views in the folder were hidden from you
  // - AND you cannot drop a view to this folder
  if (isHidden) {
    return <div />;
  }

  return (
    <header
      key={folder.id}
      onMouseOver={onMouseOver}
      className={classNames(styles.folder, { [styles.draggable]: canEdit })}>
      <div data-test-id={testId} className={styles.headerTitle} onClick={onClick}>
        <Icon
          className={classNames(styles.folderCloseActionIcon, {
            [styles.folderClosedIcon]: isFolderClosed,
          })}
          icon="ChevronDown"
          testId={`${testId}-close`}
        />
        <Paragraph title={folder.title}>{`${folder.title} (${folder.views.length})`}</Paragraph>
      </div>
      <Tooltip content={canEdit ? 'Folder options' : undefined}>
        <CardActions className={styles.actions} isDisabled={!canEdit}>
          <DropdownList>
            <DropdownListItem onClick={() => renameFolder(folder, updateScopedFolder)}>
              Rename
            </DropdownListItem>
            <DropdownListItem onClick={() => deleteFolder(folder, deleteScopedFolder)}>
              Delete
            </DropdownListItem>
          </DropdownList>
        </CardActions>
      </Tooltip>
    </header>
  );
};

Folder.propTypes = {
  testId: PropTypes.string,
  folder: PropTypes.object.isRequired,
  isFolderClosed: PropTypes.bool,
  isHidden: PropTypes.bool,
  onClick: PropTypes.func.isRequired,
  onMouseOver: PropTypes.func.isRequired,
  savedViewsActions: savedViewsActionsPropTypes.isRequired,
};

const validateTitle = (value) => {
  const trimmed = (value || '').trim();
  return trimmed.length > 0 && trimmed.length <= 32;
};

async function renameFolder(folder, updateScopedFolder) {
  const title = await openInputDialog(
    {
      title: 'Rename folder',
      confirmLabel: 'Rename folder',
      message: 'New name for the folder',
      intent: 'positive',
      maxLength: 32,
      isValid: validateTitle,
    },
    folder.title
  );
  if (title) {
    updateScopedFolder(assign(folder, { title }));
  }
}

function deleteFolder(folder, deleteScopedFolder) {
  return ModalLauncher.open(({ isShown, onClose }) => (
    <ModalConfirm
      isShown={isShown}
      title="Delete folder"
      intent="negative"
      onConfirm={() => onClose(true)}
      onCancel={() => onClose(false)}
      confirmLabel="Delete folder">
      You are about to delete the folder{' '}
      <span className={styles.modalHighlight}>{htmlEncode(folder.title)}</span>. Deleting this
      folder will also remove all the saved views inside. If you want to keep your views, please
      drag them into another folder before deleting the folder.
    </ModalConfirm>
  )).then((confirmed) => {
    if (confirmed) {
      deleteScopedFolder(folder);
    }
  });
}

async function editViewTitle(view, tracking, updateScopedFolderView) {
  const title = await openInputDialog(
    {
      title: 'Rename view',
      confirmLabel: 'Rename view',
      message: 'New name for the view',
      intent: 'positive',
      maxLength: 32,
      isValid: validateTitle,
    },
    view.title
  );
  if (title) {
    view = assign(view, { title });
    tracking.viewTitleEdited(view);
    updateScopedFolderView(view);
  }
}

function deleteView(view, tracking, deleteScopedFolderView) {
  return ModalLauncher.open(({ isShown, onClose }) => (
    <ModalConfirm
      title="Delete view"
      confirmLabel="Delete view"
      intent="negative"
      isShown={isShown}
      onConfirm={() => onClose(true)}
      onCancel={() => onClose(false)}>
      Are you sure you want to delete the view{' '}
      <span className={styles.modalHighlight}>{htmlEncode(view.title)}</span>?
    </ModalConfirm>
  )).then((confirmed) => {
    if (confirmed) {
      tracking.viewDeleted(view);
      deleteScopedFolderView(view);
    }
  });
}
