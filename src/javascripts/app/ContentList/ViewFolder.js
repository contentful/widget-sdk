/* eslint "rulesdir/restrict-inline-styles": "warn" */
import { get as getAtPath } from 'lodash';
import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import { ModalLauncher } from 'core/components/ModalLauncher';
import { ModalConfirm } from '@contentful/forma-36-react-components';
import { assign, filter } from 'utils/Collections';
import { openRoleSelector } from './RoleSelector';
import { openInputDialog } from 'app/InputDialogComponent';
import * as accessChecker from 'access_control/AccessChecker';
import { htmlEncode } from 'utils/encoder';
import * as K from 'core/utils/kefir';

export default function ViewFolder({ folder, state, actions }) {
  const { canEdit, roleAssignment, tracking } = state;
  const { UpdateFolder, DeleteFolder, UpdateView, DeleteView } = actions;
  const [views, setViews] = React.useState(
    filter(folder.views, (view) => isViewVisible(view, roleAssignment))
  );

  // Reinitialize folders visibility once accessChecker is initialized.
  React.useEffect(() => {
    return K.onValue(
      accessChecker.isInitialized$,
      (isInitialized) =>
        isInitialized &&
        setViews(filter(folder.views, (view) => isViewVisible(view, roleAssignment)))
    );
  }, [folder.views, roleAssignment]);

  // Do not render anything when:
  // - all views in the folder were hidden from you
  // - AND you cannot drop a view to this folder
  if (!canEdit && views.length < 1) {
    return null;
  }

  const isNotDefault = folder.id !== 'default';
  const draggable = canEdit ? '-draggable' : '';
  const isClosed = state.folderStates[folder.id] === 'closed';
  const collapsed = isClosed ? '-collapsed' : '';
  const currentViewId = getAtPath(state.currentView, ['id']);
  const active = (view) => (view.id === currentViewId ? '-active' : '');

  return (
    <div key={folder.id} className={classNames('view-folder', isNotDefault ? draggable : '')}>
      {isNotDefault && (
        <header className="view-folder__header">
          <div className="view-folder__title">
            {`${folder.title} (${folder.views.length})`}
            {canEdit && (
              <div className="view-folder__actions">
                <i onClick={() => renameFolder(folder, UpdateFolder)} className="fa fa-pencil" />
                <i onClick={() => deleteFolder(folder, DeleteFolder)} className="fa fa-close" />
              </div>
            )}
          </div>
          <i
            onClick={() => actions.ToggleOpened(folder)}
            className={classNames('view-folder__toggle', collapsed)}>
            ▼
          </i>
        </header>
      )}
      {!isClosed && (
        <ul
          ref={(el) => state.dnd.forViews(el, folder)}
          style={{
            minHeight: views.length === 0 ? '10px' : undefined,
            marginBottom: views.length === 0 ? '0px' : undefined,
          }}
          className={classNames('view-folder__list', collapsed)}>
          {views.map((view, index) => {
            return (
              <li
                key={view.id}
                onClick={() => actions.LoadView(view)}
                className={classNames('view-folder__item', active(view), draggable)}>
                <div className="view-folder__item-title">
                  <span title={view.title}>{view.title}</span>
                </div>
                {canEdit && (
                  <div className="view-folder__actions">
                    {roleAssignment && (
                      <i
                        onClick={doNotPropagate(async () => {
                          const roles = await openRoleSelector(roleAssignment.endpoint, view.roles);
                          if (roles !== false) {
                            const updatedView = {
                              ...view,
                              roles,
                            };
                            tracking.viewRolesEdited(view);
                            const copyViews = [...views];
                            copyViews[index] = updatedView;
                            setViews(copyViews);
                            UpdateView(updatedView);
                          }
                        })}
                        className="fa fa-eye"
                      />
                    )}
                    <i
                      onClick={doNotPropagate(() => editViewTitle(view, tracking, UpdateView))}
                      className="fa fa-pencil"
                    />
                    <i
                      onClick={doNotPropagate(() => deleteView(view, tracking, DeleteView))}
                      className="fa fa-close"
                    />
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

ViewFolder.propTypes = {
  folder: PropTypes.object.isRequired,
  state: PropTypes.object.isRequired,
  actions: PropTypes.object.isRequired,
};

async function renameFolder(folder, UpdateFolder) {
  const title = await openInputDialog(
    {
      title: 'Rename folder',
      confirmLabel: 'Rename folder',
      message: 'New name for the folder',
      intent: 'positive',
      maxLenght: 32,
      isValid: (value) => {
        const trimmed = (value || '').trim();
        return trimmed.length > 0 && trimmed.length <= 32;
      },
    },
    folder.title
  );
  if (title) {
    UpdateFolder(assign(folder, { title }));
  }
}

function deleteFolder(folder, DeleteFolder) {
  return ModalLauncher.open(({ isShown, onClose }) => (
    <ModalConfirm
      isShown={isShown}
      title="Delete folder"
      intent="negative"
      onConfirm={() => {
        onClose(true);
      }}
      onCancel={() => {
        onClose(false);
      }}
      confirmLabel="Delete folder">
      You are about to delete the folder{' '}
      <span className="modal-dialog__highlight">{htmlEncode(folder.title)}</span>. Deleting this
      folder will also remove all the saved views inside. If you want to keep your views, please
      drag them into another folder before deleting the folder.
    </ModalConfirm>
  )).then((confirmed) => {
    if (confirmed) {
      DeleteFolder(folder);
    }
  });
}

async function editViewTitle(view, tracking, UpdateView) {
  const title = await openInputDialog(
    {
      title: 'Rename view',
      confirmLabel: 'Rename view',
      message: 'New name for the folder',
      intent: 'positive',
      isValid: (value) => {
        const trimmed = (value || '').trim();
        return trimmed.length > 0 && trimmed.length <= 32;
      },
    },
    view.title
  );
  if (title) {
    view = assign(view, { title });
    tracking.viewTitleEdited(view);
    UpdateView(view);
  }
}

function deleteView(view, tracking, DeleteView) {
  return ModalLauncher.open(({ isShown, onClose }) => (
    <ModalConfirm
      title="Delete view"
      confirmLabel="Delete view"
      intent="negative"
      isShown={isShown}
      onConfirm={() => {
        onClose(true);
      }}
      onCancel={() => {
        onClose(false);
      }}>
      Are you sure you want to delete the view{' '}
      <span className="modal-dialog__highlight">{htmlEncode(view.title)}</span>?
    </ModalConfirm>
  )).then((confirmed) => {
    if (confirmed) {
      tracking.viewDeleted(view);
      DeleteView(view);
    }
  });
}

function isViewVisible(view, roleAssignment) {
  if (!view) {
    return false;
  }

  if (!isContentTypeReadable(view.contentTypeId)) {
    return false;
  }

  if (roleAssignment) {
    return isVisibleForAssignedRoles(view, roleAssignment.membership);
  }

  return true;
}

/**
 * If the view has a `roles` property we only return true if the
 * user has one of the roles given.
 *
 * We always return true if the user is an admin or if the view
 * does not have the `roles` property.
 */
function isVisibleForAssignedRoles(view, membership) {
  if (membership.admin) {
    return true;
  } else {
    return view.roles
      ? view.roles.some((viewRoleId) => {
          return membership.roles.some((role) => viewRoleId === role.sys.id);
        })
      : true;
  }
}

function isContentTypeReadable(contentTypeId) {
  if (typeof contentTypeId === 'string') {
    const can = accessChecker.canPerformActionOnEntryOfType;
    const canRead = can('read', contentTypeId);
    const canCreate = can('create', contentTypeId);

    // If a user can read entries of a specific content type created by
    // themselves ONLY, then calls to `can('read', ctId)` will return `false`.
    // While the return value is correct (a user cannot, in general, read all
    // entries of a type), it causes confusion by hiding views if user's roles
    // contain such a policy. To mitigate that we also check if they can create
    // entries of a given CT.
    return canRead || canCreate;
  } else {
    return true;
  }
}

function doNotPropagate(fn) {
  return (e) => {
    e.stopPropagation();
    fn(e);
  };
}
