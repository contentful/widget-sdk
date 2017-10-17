import {h} from 'ui/Framework';
import {makeCtor} from 'utils/TaggedValues';
import {assign} from 'utils/Collections';

import {
  createStore,
  makeReducer,
  combineStoreComponents
} from 'ui/Framework/Store';

import initSavedViewsComponent from './SavedViewsComponent';

import {byName as Colors} from 'Styles/Colors';
import {container} from 'ui/Layout';

import openInputDialog from 'app/InputDialog';


const Select = makeCtor('Select');

const VIEWS_SHARED = 'shared';
const VIEWS_PRIVATE = 'private';

export default function ({
  entityFolders,
  loadView,
  getCurrentView,
  roleAssignment
}) {
  const sharedViews = initSavedViewsComponent({
    scopedFolders: entityFolders.shared,
    loadView,
    getCurrentView,
    roleAssignment
  });

  const privateViews = initSavedViewsComponent({
    scopedFolders: entityFolders.private,
    loadView,
    getCurrentView
  });

  const reduce = makeReducer({[Select]: (_, next) => next});
  const selector = {
    store: createStore(VIEWS_SHARED, reduce),
    actions: {Select}
  };

  return assign(
    {api: {openSaveCurrentViewModal}},
    combineStoreComponents(render, {selector, sharedViews, privateViews})
  );

  function render ({selector, sharedViews, privateViews}) {
    return h('div', [
      container({
        display: 'flex',
        justifyContent: 'space-between',
        padding: '1.5rem',
        backgroundColor: Colors.elementLightest,
        borderBottom: `1px solid ${Colors.elementMid}`
      }, [
        button(selector, VIEWS_SHARED, 'All views'),
        button(selector, VIEWS_PRIVATE, 'My views')
      ]),
      views(selector.state, VIEWS_SHARED, sharedViews),
      views(selector.state, VIEWS_PRIVATE, privateViews)
    ]);
  }

  function views (selected, value, component) {
    if (selected === value) {
      // Use `key` so tree is not reused between shared and private views:
      // it causes nasty DnD bugs
      return h('div', {key: value}, [component.view]);
    }
  }

  function button ({state, actions}, value, label) {
    return h('button', {
      style: {
        color: Colors.textLight,
        letterSpacing: '2px',
        fontSize: '.8em',
        textTransform: 'uppercase',
        fontWeight: state === value ? 'bold' : 'normal'
      },
      onClick: () => actions.Select(value)
    }, [label]);
  }

  function openSaveCurrentViewModal () {
    return openInputDialog({
      title: 'Save current view',
      confirmLabel: 'Add to views',
      message: 'Name of the view',
      input: {min: 1, max: 32},
      showSaveAsSharedCheckbox: entityFolders.shared.canEdit
    }).promise.then(payload => {
      if (payload.shouldSaveCurrentViewAsShared) {
        sharedViews.api.saveCurrentView(payload.viewTitle);
      } else {
        privateViews.api.saveCurrentView(payload.viewTitle);
      }
    });
  }

}
