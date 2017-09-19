import {find} from 'lodash';
import {update, assign, map, concat, filter} from 'utils/Collections';
import {makeCtor} from 'utils/TaggedValues';
import {createStore, makeReducer} from 'ui/Framework/Store';

import ViewMenu from './ViewMenu';
import {makeBlankFolder} from 'data/UiConfig/Blanks';
import * as Tracking from 'analytics/events/SearchAndViews';

import TheStore from 'TheStore';
import logger from 'logger';
import notification from 'notification';
import random from 'random';

const LoadView = makeCtor('LoadView');
const ToggleOpened = makeCtor('ToggleOpened');
const RestoreDefaultViews = makeCtor('RestoreDefaultViews');
const RevertFolders = makeCtor('RevertFolders');
const CreateFolder = makeCtor('CreateFolder');
const UpdateFolder = makeCtor('UpdateFolder');
const DeleteFolder = makeCtor('DeleteFolder');
const SaveCurrentView = makeCtor('SaveCurrentView');
const UpdateView = makeCtor('UpdateView');
const DeleteView = makeCtor('DeleteView');

const folderStatesStore = TheStore.forKey('folderStates');

export default function ({
  spaceContext,
  scopedUiConfig,
  enableRoleAssignment,
  loadView,
  getCurrentView
}) {
  const reduce = makeReducer({
    [LoadView] (state, view) {
      loadView(view);
      Tracking.viewLoaded(view);
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
      return assign(state, {folders: scopedUiConfig.get()});
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
    [SaveCurrentView] (state, title) {
      const view = assign(getCurrentView(), {id: random.id(), title});
      const folder = findDefaultFolder(state.folders);
      const updated = updateFolderViews(state.folders, folder, views => {
        return concat(views, [view]);
      });

      loadView(view);
      Tracking.viewCreated(view, folder);

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
    folders: ensureDefaultFolder(scopedUiConfig.get()),
    folderStates: folderStatesStore.get() || {},
    space: spaceContext.space,
    endpoint: spaceContext.endpoint,
    canEdit: spaceContext.uiConfig.canEdit,
    enableRoleAssignment,
    dnd: {forFolders: () => {}, forViews: () => {}}
  }, reduce);

  function saveFolders (state, updatedFolders) {
    return assign(state, {folders: saveUiConfig(updatedFolders)});
  }

  function saveUiConfig (updated) {
    // We display this notification w/o confirming changes were successfully
    // persisted. If it fails, consecutive notification is presented and the
    // state is reverted.
    notification.info('Saved views updated successfully.');

    scopedUiConfig.save(updated).catch(error => {
      logger.logServerWarn('Error trying to update saved views', {error});
      notification.error('Error while updating saved views. Your changes were reverted.');
      store.dispatch(RevertFolders);
    });

    // Updated version is returned right away. We use `scopedUiConfig.get`
    // instead of `updated` so defaults are returned if the UI config is reset
    // by passing `undefined` to `scopedUiConfig.save`.
    return scopedUiConfig.get();
  }

  const actions = {
    LoadView,
    ToggleOpened,
    RestoreDefaultViews,
    RevertFolders,
    CreateFolder,
    UpdateFolder,
    DeleteFolder,
    SaveCurrentView,
    UpdateView,
    DeleteView
  };

  return {render: ViewMenu, store, actions};
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
