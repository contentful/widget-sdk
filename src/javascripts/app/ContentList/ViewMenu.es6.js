import {get as getAtPath} from 'lodash';
import {h} from 'ui/Framework';

import ViewFolder from './ViewFolder';
import openInputDialog from 'app/InputDialog';

export default function render (state, actions) {
  const {folders, canEdit} = state;

  // The default folder is ensured (minimal length is 1):
  const isEmpty = getAtPath(folders, ['length']) === 1 &&
                  getAtPath(folders, [0, 'views', 'length']) === 0;

  return h('.view-menu', [
    isEmpty ? renderEmpty(state) : renderFolders(state, actions),
    h('.view-menu__actions', [
      isEmpty && canEdit.views && h('button.text-link', {
        onClick: () => actions.RestoreDefaultViews()
      }, [h('i.fa.fa-refresh'), 'Restore default views']),
      canEdit.folders && h('button.text-link', {
        onClick: () => openInputDialog({
          title: 'Add folder',
          confirmLabel: 'Add folder',
          message: 'Please provide a name for your new folder:',
          input: {min: 1, max: 32}
        }).promise.then(actions.CreateFolder)
      }, [h('i.fa.fa-folder'), 'Add folder']),
      canEdit.views && h('button.text-link', {
        onClick: () => openInputDialog({
          title: 'Save current view',
          confirmLabel: 'Save current view',
          message: 'Please provide a name for the view you’re about to save:',
          input: {min: 1, max: 32}
        }).promise.then(actions.SaveCurrentView)
      }, [h('i.fa.fa-search-plus'), 'Save current view'])
    ])
  ]);
}

function renderFolders (state, actions) {
  return h('div', {
    ref: state.dnd.forFolders
  }, state.folders.map(folder => {
    return ViewFolder(folder, state, actions);
  }));
}

function renderEmpty (state) {
  return h('.view-folder', [
    h('.view-folder__empty', state.canEdit.views ? [
      h('strong', ['No views stored']),
      h('p', ['Please use one of the options below.'])
    ] : [
      h('strong', ['No views available']),
      h('p', ['Your administrator has not set up any views yet.'])
    ])
  ]);
}
