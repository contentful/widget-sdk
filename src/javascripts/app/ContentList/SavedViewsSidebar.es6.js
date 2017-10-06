import {h} from 'ui/Framework';
import {makeCtor} from 'utils/TaggedValues';

import {
  createStore,
  makeReducer,
  bindActions,
  combineStoreComponents
} from 'ui/Framework/Store';

import initSavedViewsComponent from './SavedViewsComponent';

import {byName as Colors} from 'Styles/Colors';

const Select = makeCtor('Select');

const VIEWS_SHARED = 'shared';
const VIEWS_PRIVATE = 'private';

export default function ({
  scopedUiConfig,
  loadView,
  getCurrentView,
  roleAssignment
}) {
  const sharedSavedViews = initSavedViewsComponent({
    scopedUiConfig: scopedUiConfig.shared,
    loadView,
    getCurrentView,
    roleAssignment
  });

  const privateSavedViews = initSavedViewsComponent({
    scopedUiConfig: scopedUiConfig.private,
    loadView,
    getCurrentView
  });

  const reduce = makeReducer({[Select]: (_, next) => next});
  const store = createStore('shared', reduce);
  const selector = {
    store: store,
    actions: bindActions(store, { Select })
  };

  return combineStoreComponents(render, {
    selector: selector,
    sharedViews: sharedSavedViews,
    privateViews: privateSavedViews
  });

  function render ({selector, sharedViews, privateViews}) {
    return h('div', [
      h('div', {
        style: {
          display: 'flex',
          justifyContent: 'space-between',
          padding: '1.5rem',
          backgroundColor: Colors.elementLightest,
          borderBottom: `1px solid ${Colors.elementMid}`
        }
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
}
