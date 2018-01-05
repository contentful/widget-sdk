import {find, isPlainObject} from 'lodash';
import {update, assign, map, concat, filter} from 'utils/Collections';
import {makeCtor} from 'utils/TaggedValues';
import {createStore, makeReducer} from 'ui/Framework/Store';

import ViewMenu from './ViewMenu';
import createDnD from './SavedViewsDnD';
import {makeBlankFolder} from 'data/UiConfig/Blanks';

import openRoleSelector from './RoleSelector';

import { getStore } from 'utils/TheStore';
import notification from 'notification';
import random from 'random';

const LoadView = makeCtor('LoadView');
const ToggleOpened = makeCtor('ToggleOpened');
const RestoreDefaultViews = makeCtor('RestoreDefaultViews');
const RevertFolders = makeCtor('RevertFolders');
const AlterFolders = makeCtor('AlterFolders');
const CreateFolder = makeCtor('CreateFolder');
const UpdateFolder = makeCtor('UpdateFolder');
const DeleteFolder = makeCtor('DeleteFolder');
const SaveCurrentView = makeCtor('SaveCurrentView');
const UpdateView = makeCtor('UpdateView');
const DeleteView = makeCtor('DeleteView');

const folderStatesStore = getStore().forKey('folderStates');

export default function ({
  scopedFolders,
  loadView,
  getCurrentView,
  roleAssignment,
  tracking
}) {
  const reduce = makeReducer({
    [LoadView] (state, view) {
      loadView(view);
      tracking.viewLoaded(view);
      return assign(state, {currentView: view});
    },
    [ToggleOpened] (state, folder) {
      const updated = update(state.folderStates, [folder.id], value => {
        return value === 'closed' ? null : 'closed';
      });
      folderStatesStore.set(updated);
      return assign(state, {folderStates: updated});
    },
    [RestoreDefaultViews] (state) {
      return saveFolders(state, undefined);
    },
    [RevertFolders] (state) {
      return assign(state, {folders: scopedFolders.get()});
    },
    [AlterFolders] (state, folders) {
      return saveFolders(state, folders);
    },
    [CreateFolder] (state, title) {
      const blank = makeBlankFolder({title});
      return saveFolders(state, concat(state.folders, [blank]));
    },
    [UpdateFolder] (state, folder) {
      return saveFolders(state, map(state.folders, cur => {
        return cur.id === folder.id ? folder : cur;
      }));
    },
    [DeleteFolder] (state, folder) {
      return saveFolders(state, filter(state.folders, cur => {
        return cur.id !== folder.id;
      }));
    },
    [SaveCurrentView] (state, {title, roles}) {
      const view = assign(getCurrentView(), {id: random.id(), title, roles});
      const folder = findDefaultFolder(state.folders);
      const updated = updateFolderViews(state.folders, folder, views => {
        return concat(views, [view]);
      });

      loadView(view);
      tracking.viewCreated(view, folder);

      return assign(state, {
        folders: saveUiConfig(updated),
        currentView: view
      });
    },
    [UpdateView] (state, view) {
      const folder = findContainingFolder(state.folders, view);
      return saveFolders(state, updateFolderViews(state.folders, folder, views => {
        return map(views, cur => cur.id === view.id ? view : cur);
      }));
    },
    [DeleteView] (state, view) {
      const folder = findContainingFolder(state.folders, view);
      return saveFolders(state, updateFolderViews(state.folders, folder, views => {
        return filter(views, cur => cur.id !== view.id);
      }));
    }
  });

  const store = createStore({
    currentView: getCurrentView(),
    folders: prepareFolders(scopedFolders.get()),
    canEdit: scopedFolders.canEdit,
    folderStates: folderStatesStore.get() || {},
    dnd: createDnD(scopedFolders.get, folders => store.dispatch(AlterFolders, folders)),
    roleAssignment,
    tracking
  }, reduce);

  function saveFolders (state, updatedFolders) {
    return assign(state, {folders: saveUiConfig(updatedFolders)});
  }

  function saveUiConfig (updated) {
    // We display this notification w/o confirming changes were successfully
    // persisted. If it fails, consecutive notification is presented and the
    // state is reverted.
    notification.info('View(s) updated successfully.');

    scopedFolders.set(updated).catch(() => {
      notification.error('Error while updating saved views. Your changes were reverted.');
      store.dispatch(RevertFolders);
    });

    // Calling `scopedFolders.set()` updates the local version of the UiConfig
    // right away. `scopedFolders.get()` will return it w/o waiting for the API
    // roundtrip. It returns defaults if the local version is `undefined`.
    return scopedFolders.get();
  }

  function saveCurrentView (title) {
    if (scopedFolders.canEdit && roleAssignment) {
      openRoleSelector(roleAssignment.endpoint)
        .then(roles => store.dispatch(SaveCurrentView, {title, roles}));
    } else {
      store.dispatch(SaveCurrentView, {title});
    }
  }

  const actions = {
    LoadView,
    ToggleOpened,
    RestoreDefaultViews,
    RevertFolders,
    AlterFolders,
    CreateFolder,
    UpdateFolder,
    DeleteFolder,
    SaveCurrentView,
    UpdateView,
    DeleteView
  };

  return {
    api: {saveCurrentView},
    render: ViewMenu,
    store,
    actions
  };
}

function prepareFolders (folders) {
  return ensureValidViews(ensureDefaultFolder(folders));
}

function ensureValidViews (folders) {
  return map(folders, folder => {
    return update(folder, ['views'], views => {
      return filter(views || [], view => isPlainObject(view));
    });
  });
}

function ensureDefaultFolder (folders) {
  if (findDefaultFolder(folders)) {
    return folders;
  } else {
    const defaultFolder = makeBlankFolder({id: 'default', title: 'Views'});
    return concat([defaultFolder], folders);
  }
}

function findDefaultFolder (folders) {
  return find(folders, {id: 'default'});
}

function findContainingFolder (folders, view) {
  return find(folders, folder => find(folder.views, {id: view.id}));
}

function updateFolderViews (folders, folder, fn) {
  folder = update(folder, ['views'], fn);
  return map(folders, cur => cur.id === folder.id ? folder : cur);
}
