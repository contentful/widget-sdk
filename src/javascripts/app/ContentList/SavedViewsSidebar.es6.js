import {h} from 'ui/Framework';
import {makeCtor} from 'utils/TaggedValues';
import {assign} from 'utils/Collections';
import {forScopedViews as trackingForScopedViews} from 'analytics/events/SearchAndViews';

import {
  createStore,
  makeReducer,
  combineStoreComponents
} from 'ui/Framework/Store';

import initSavedViewsComponent from './SavedViewsComponent';
import SaveCurrentViewModal from './SaveViewDialog';

import {byName as colors} from 'Styles/Colors';
import {container} from 'ui/Layout';


const Select = makeCtor('Select');

const VIEWS_SHARED = 'shared';
const VIEWS_PRIVATE = 'private';

export default function ({
  entityFolders,
  loadView,
  getCurrentView,
  roleAssignment
}) {
  const sharedViewsTracking = trackingForScopedViews(VIEWS_SHARED);
  const privateViewsTracking = trackingForScopedViews(VIEWS_PRIVATE);

  const sharedViews = initSavedViewsComponent({
    scopedFolders: entityFolders.shared,
    loadView,
    getCurrentView,
    roleAssignment,
    tracking: sharedViewsTracking
  });

  const privateViews = initSavedViewsComponent({
    scopedFolders: entityFolders.private,
    loadView,
    getCurrentView,
    tracking: privateViewsTracking
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
    return h('div', {
      style: {
        backgroundColor: colors.elementLightest,
        height: '100vh'
      }
    }, [
      container({
        paddingTop: '1rem',
        paddingRight: '1.5rem',
        paddingLeft: '1.5rem',
        backgroundColor: colors.elementLightest,
        borderBottom: `1px solid ${colors.elementMid}`
      }, [
        h('ul.workbench-nav__tabs', [
          button(selector, VIEWS_SHARED, 'All views'),
          button(selector, VIEWS_PRIVATE, 'My views')
        ])
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
    return h('li', {
      ariaSelected: String(state === value),
      role: 'tab',
      style: {
        fontSize: '14px',
        fontWeight: 'normal',
        color: (state === value) ? colors.textDark : colors.textLight
      },
      onClick: () => actions.Select(value)
    }, [label]);
  }

  function openSaveCurrentViewModal () {
    return SaveCurrentViewModal({
      showSaveAsSharedCheckbox: entityFolders.shared.canEdit
    }).promise.then(({viewTitle, shouldSaveCurrentViewAsShared}) => {
      const api = shouldSaveCurrentViewAsShared ? sharedViews.api : privateViews.api;
      api.saveCurrentView(viewTitle);
    });
  }
}
