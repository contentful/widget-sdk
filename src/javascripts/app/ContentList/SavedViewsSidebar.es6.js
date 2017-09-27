import {h} from 'ui/Framework';
import {makeCtor} from 'utils/TaggedValues';

import {
  createStore,
  makeReducer,
  renderStoreComponent,
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

  return combineStoreComponents(render, {
    selected: {store},
    shared: sharedSavedViews,
    private: privateSavedViews
  });

  function render ({selected}) {
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
        button(selected, VIEWS_SHARED, 'All views'),
        button(selected, VIEWS_PRIVATE, 'My views')
      ]),
      h('div', [
        selected === VIEWS_SHARED && renderStoreComponent(sharedSavedViews),
        selected === VIEWS_PRIVATE && renderStoreComponent(privateSavedViews)
      ])
    ]);
  }

  function button (selected, value, label) {
    return h('button', {
      style: {
        color: Colors.textLight,
        letterSpacing: '2px',
        fontSize: '.8em',
        textTransform: 'uppercase',
        fontWeight: selected === value ? 'bold' : 'normal'
      },
      onClick: () => store.dispatch(Select, value)
    }, [label]);
  }
}
