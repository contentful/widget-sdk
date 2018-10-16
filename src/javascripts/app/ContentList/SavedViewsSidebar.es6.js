import React from 'react';
import { makeCtor } from 'utils/TaggedValues.es6';
import { assign } from 'utils/Collections.es6';
import { forScopedViews as trackingForScopedViews } from 'analytics/events/SearchAndViews.es6';

import { createStore, makeReducer, combineStoreComponents } from 'ui/Framework/Store.es6';

import initSavedViewsComponent from './SavedViewsComponent.es6';
import SaveCurrentViewDialog from './SaveViewDialog.es6';

import { byName as colors } from 'Styles/Colors.es6';

const Select = makeCtor('Select');

const VIEWS_SHARED = 'shared';
const VIEWS_PRIVATE = 'private';

export default function({ entityFolders, loadView, getCurrentView, roleAssignment }) {
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

  const reduce = makeReducer({ [Select]: (_, next) => next });
  const selector = {
    store: createStore(VIEWS_SHARED, reduce),
    actions: { Select }
  };

  // eslint-disable-next-line react/prop-types
  const Views = ({ selected, value, component }) => {
    if (selected === value) {
      // Use `key` so tree is not reused between shared and private views:
      // it causes nasty DnD bugs
      return <div key={value}>{component.view}</div>;
    }
    return null;
  };

  // eslint-disable-next-line react/prop-types
  const TabButton = ({ selector, value, label }) => {
    return (
      <li
        ariaSelected={`${selector.state === value}`}
        role="tab"
        style={{
          fontSize: '14px',
          fontWeight: 'normal',
          color: selector.state === value ? colors.textDark : colors.textLight
        }}
        onClick={() => selector.actions.Select(value)}>
        {label}
      </li>
    );
  };

  // eslint-disable-next-line react/prop-types
  function render({ selector, sharedViews, privateViews }) {
    return (
      <div
        style={{
          backgroundColor: colors.elementLightest,
          height: '100vh',
          borderRight: `1px solid ${colors.elementDarkest}`,
          boxShadow: '1px 0 2px 0 rgba(0,0,0,0.09)'
        }}>
        <div
          style={{
            paddingTop: '1rem',
            paddingRight: '1.5rem',
            paddingLeft: '1.5rem',
            backgroundColor: colors.elementLightest,
            borderBottom: `1px solid ${colors.elementMid}`
          }}>
          <ul className="workbench-nav__tabs">
            <TabButton selector={selector} value={VIEWS_SHARED} label="Shared views" />
            <TabButton selector={selector} value={VIEWS_PRIVATE} label="My views" />
          </ul>
        </div>
        <Views selected={selector.state} value={VIEWS_SHARED} component={sharedViews} />
        <Views selected={selector.state} value={VIEWS_PRIVATE} component={privateViews} />
      </div>
    );
  }

  function saveCurrentView() {
    return SaveCurrentViewDialog({
      allowViewTypeSelection: entityFolders.shared.canEdit,
      allowRoleAssignment: roleAssignment
    }).promise.then(({ title, isShared }) => {
      const [api, tab] = isShared
        ? [sharedViews.api, VIEWS_SHARED]
        : [privateViews.api, VIEWS_PRIVATE];

      api.saveCurrentView(title);
      selector.store.dispatch(selector.actions.Select, tab);
    });
  }

  return assign(
    { api: { saveCurrentView } },
    combineStoreComponents(render, { selector, sharedViews, privateViews })
  );
}
