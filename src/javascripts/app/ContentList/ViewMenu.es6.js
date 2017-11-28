import {get as getAtPath} from 'lodash';
import {h} from 'ui/Framework';

import ViewFolder from './ViewFolder';
import openInputDialog from 'app/InputDialog';
import addFolderIcon from 'svg/add-folder';

export default function render (state, actions) {
  const {folders, canEdit} = state;

  // The default folder is ensured (minimal length is 1):
  const isEmpty = getAtPath(folders, ['length']) === 1 &&
                  getAtPath(folders, [0, 'views', 'length']) === 0;

  return h('.view-menu-wrapper', [
    h('.view-menu', [
      h('.view-menu__folders', [
        isEmpty ? renderEmpty(state, actions) : renderFolders(state, actions)
      ]),
      canEdit && h('.view-menu__actions', [
        h('div', [h('.view-folder__seperator')]),
        h('button.text-link', {
          onClick: () => openInputDialog({
            title: 'Add folder',
            confirmLabel: 'Add folder',
            message: 'Please provide a name for your new folder:',
            input: {min: 1, max: 32}
          }).promise.then(actions.CreateFolder)
        }, [
          h('i', {style: {marginRight: '5px'}}, [addFolderIcon]),
          'Add folder'
        ])
      ])
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

function renderEmpty (state, actions) {
  const { canEdit } = state;

  return h('.view-menu__empty', [
    h('.view-menu__empty-description', {}, [
      h('.view-folder__empty', state.canEdit ? [
        h('strong', ['There are no views yet']),
        h('p', ['A view displays a list of entries you searched for. By saving the a view to this list, you will be able to re-use it later.'])
      ] : [
        h('strong', ['There are no views yet']),
        h('p', ['A view displays a list of entries you searched for. Your administrator has not set up any views yet.'])
      ])
    ]),
    h('.view-menu__empty-cta', [
      canEdit && h('button.text-link', {
        onClick: actions.RestoreDefaultViews
      }, [h('i.fa.fa-refresh', {style: {marginRight: '5px'}}), 'Restore default views'])
    ])
  ]);
}
