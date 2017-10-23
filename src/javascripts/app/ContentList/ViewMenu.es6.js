import {get as getAtPath} from 'lodash';
import {h} from 'ui/Framework';

import ViewFolder from './ViewFolder';
import openInputDialog from 'app/InputDialog';
import addFolderIcon from 'svg/add-folder';
import { byName as colors } from 'Styles/Colors';

export default function render (state, actions) {
  const {folders, canEdit} = state;

  // The default folder is ensured (minimal length is 1):
  const isEmpty = getAtPath(folders, ['length']) === 1 &&
                  getAtPath(folders, [0, 'views', 'length']) === 0;
  const separator = h('div', {
    style: {
      paddingRight: '20px'
    }
  }, [
    h('div', {
      style: {
        marginBottom: '12px',
        borderBottom: `1px solid ${colors.elementDark}`
      }
    })
  ]);

  return h('.view-menu', [
    isEmpty ? renderEmpty(state) : renderFolders(state, actions),
    h('.view-menu__actions', [
      isEmpty && canEdit && h('button.text-link', {
        onClick: actions.RestoreDefaultViews
      }, [h('i.fa.fa-refresh'), 'Restore default views']),
      separator,
      canEdit && h('button.text-link', {
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
  ]);
}

function renderFolders (state, actions) {
  return h('div', {
    ref: state.dnd.forFolders,
    style: {
      height: 'calc(100vh - 300px)',
      overflowY: 'scroll'
    }
  }, state.folders.map(folder => {
    return ViewFolder(folder, state, actions);
  }));
}

function renderEmpty (state) {
  return h('.view-folder', [
    h('.view-folder__empty', state.canEdit ? [
      h('strong', ['No views stored']),
      h('p', ['Please use one of the options below.'])
    ] : [
      h('strong', ['No views available']),
      h('p', ['Your administrator has not set up any views yet.'])
    ])
  ]);
}
