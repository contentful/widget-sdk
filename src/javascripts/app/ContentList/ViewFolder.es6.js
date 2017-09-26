import {get as getAtPath} from 'lodash';
import {assign, filter} from 'utils/Collections';
import {h} from 'ui/Framework';
import {htmlEncode} from 'encoder';

import openRoleSelector from './RoleSelector';
import openInputDialog from 'app/InputDialog';
import * as Tracking from 'analytics/events/SearchAndViews';

import accessChecker from 'accessChecker';
import modalDialog from 'modalDialog';

export default function render (folder, state, actions) {
  const {canEdit, roleAssignment} = state;
  const {UpdateFolder, DeleteFolder, UpdateView, DeleteView} = actions;
  const views = filter(folder.views, view => isViewVisible(view, roleAssignment));

  // Do not render anything when:
  // - all views in the folder were hidden from you
  // - AND you cannot drop a view to this folder
  if (!canEdit && views.length < 1) {
    return null;
  }

  const isNotDefault = folder.id !== 'default';
  const isClosed = state.folderStates[folder.id] === 'closed';
  const maybeCollapsed = isClosed ? '-collapsed' : '';
  const currentViewId = getAtPath(state.currentView, ['id']);

  return h('.view-folder', {class: isNotDefault ? '-draggable' : ''}, [
    isNotDefault && h('header.view-folder__header', [
      h('div.view-folder__title', [
        `${folder.title} (${folder.views.length})`,
        canEdit && h('.view-folder__actions', [
          h('i.fa.fa-pencil', {onClick: () => renameFolder(folder, UpdateFolder)}),
          h('i.fa.fa-close', {onClick: () => deleteFolder(folder, DeleteFolder)})
        ])
      ]),
      h('i.view-folder__toggle', {
        class: maybeCollapsed,
        onClick: () => actions.ToggleOpened(folder)
      }, ['▼'])
    ]),
    h('ul.view-folder__list', {
      class: maybeCollapsed,
      ref: el => state.dnd.forViews(el, folder)
    }, isClosed ? [] : views.map(view => {
      return h('li.view-folder__item', {
        class: view.id === currentViewId ? '-active' : '',
        onClick: () => actions.LoadView(view)
      }, [
        h('.view-folder__item-title', [
          h('span', {title: view.title}, [view.title])
        ]),
        canEdit && h('.view-folder__actions', [
          roleAssignment && h('i.fa.fa-eye', {
            onClick: doNotPropagate(() => editViewRoles(view, roleAssignment.endpoint, UpdateView))
          }),
          h('i.fa.fa-pencil', {
            onClick: doNotPropagate(() => editViewTitle(view, UpdateView))
          }),
          h('i.fa.fa-close', {
            onClick: doNotPropagate(() => deleteView(view, DeleteView))
          })
        ])
      ]);
    }))
  ]);
}

function renameFolder (folder, UpdateFolder) {
  openInputDialog({
    title: 'Rename folder',
    confirmLabel: 'Rename folder',
    message: 'Please provide a new name for your folder:',
    input: {value: folder.title, min: 1, max: 32}
  }).promise.then(title => UpdateFolder(assign(folder, {title})));
}

function deleteFolder (folder, DeleteFolder) {
  modalDialog.openConfirmDeleteDialog({
    title: 'Delete folder',
    confirmLabel: 'Delete folder',
    message: `You are about to delete the folder
      <span class="modal-dialog__highlight">${htmlEncode(folder.title)}</span>.
      Deleting this folder will also remove all the saved views inside. If you
      want to keep your views, please drag them into another folder before
      deleting the folder.`
  }).promise.then(() => DeleteFolder(folder));
}

function editViewRoles (view, endpoint, UpdateView) {
  openRoleSelector(endpoint, view.roles)
    .then(roles => {
      view = assign(view, {roles});
      Tracking.viewRolesEdited(view);
      UpdateView(view);
    });
}

function editViewTitle (view, UpdateView) {
  openInputDialog({
    title: 'Rename view',
    message: 'Please provide a new name for your view:',
    input: {value: view.title, min: 1, max: 32}
  }).promise.then(title => {
    view = assign(view, {title});
    Tracking.viewTitleEdited(view);
    UpdateView(view);
  });
}

function deleteView (view, DeleteView) {
  modalDialog.openConfirmDeleteDialog({
    title: 'Delete view',
    message: `Do you really want to delete the view
      <span class="modal-dialog__highlight">${htmlEncode(view.title)}</span>?`
  }).promise.then(() => {
    Tracking.viewDeleted(view);
    DeleteView(view);
  });
}

function isViewVisible (view, roleAssignment) {
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
function isVisibleForAssignedRoles (view, membership) {
  if (membership.admin) {
    return true;
  } else {
    return view.roles ? view.roles.some(viewRoleId => {
      return membership.roles.some(role => viewRoleId === role.sys.id);
    }) : true;
  }
}

function isContentTypeReadable (contentTypeId) {
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

function doNotPropagate (fn) {
  return e => {
    e.stopPropagation();
    fn(e);
  };
}
