import React from 'react';
import { css } from 'emotion';
import cn from 'classnames';
import { makeCtor } from 'utils/TaggedValues';
import { assign } from 'utils/Collections';
import { Tabs, Tab, TabPanel } from '@contentful/forma-36-react-components';
import tokens from '@contentful/forma-36-tokens';
import { forScopedViews as trackingForScopedViews } from 'analytics/events/SearchAndViews';
import createViewPersistor from 'data/ListViewPersistor';

import { createStore, makeReducer, combineStoreComponents } from 'ui/Framework/Store';

import initSavedViewsComponent from './SavedViewsComponent';
import SaveCurrentViewDialog from './SaveViewDialog';

const Select = makeCtor('Select');

const VIEWS_SHARED = 'shared';
const VIEWS_PRIVATE = 'private';

const styles = {
  tabPanel: css({
    flexGrow: 1,
    display: 'flex',
    flexDirection: 'column',
  }),
  tabsWrapper: css({
    paddingTop: tokens.spacingM,
    paddingRight: tokens.spacingL,
    paddingLeft: tokens.spacingM,
    backgroundColor: tokens.colorElementLightest,
    borderBottom: `1px solid ${tokens.colorElementMid}`,
  }),
};

export default function ({ entityType, entityFolders, roleAssignment }) {
  const sharedViewsTracking = trackingForScopedViews(VIEWS_SHARED);
  const privateViewsTracking = trackingForScopedViews(VIEWS_PRIVATE);

  const viewPersistor = createViewPersistor({ entityType });
  const loadView = viewPersistor.save;
  const getCurrentView = viewPersistor.read;

  const sharedViews = initSavedViewsComponent({
    scopedFolders: entityFolders.shared,
    loadView,
    getCurrentView,
    roleAssignment,
    tracking: sharedViewsTracking,
  });

  const privateViews = initSavedViewsComponent({
    scopedFolders: entityFolders.private,
    loadView,
    getCurrentView,
    tracking: privateViewsTracking,
  });

  const reduce = makeReducer({ [Select]: (_, next) => next });
  const selector = {
    store: createStore(VIEWS_SHARED, reduce),
    actions: { Select },
  };

  // eslint-disable-next-line react/prop-types
  const Views = ({ selected, value, component }) => {
    if (selected === value) {
      // Use `key` so tree is not reused between shared and private views:
      // it causes nasty DnD bugs
      return (
        <TabPanel id={value} key={value} className={styles.tabPanel}>
          {component.view /* eslint-disable-line react/prop-types */}
        </TabPanel>
      );
    }
    return null;
  };

  // eslint-disable-next-line react/prop-types
  function render({ selector, sharedViews, privateViews }) {
    return (
      <div className={cn('saved-views-wrapper', styles.savedViewsWrapper)}>
        <div className={styles.tabsWrapper}>
          <Tabs role="tablist">
            <Tab
              id={VIEWS_SHARED}
              // eslint-disable-next-line react/prop-types
              selected={selector.state === VIEWS_SHARED}
              onSelect={() => {
                // eslint-disable-next-line react/prop-types
                selector.actions.Select(VIEWS_SHARED);
              }}>
              Shared views
            </Tab>
            <Tab
              id={VIEWS_PRIVATE}
              // eslint-disable-next-line react/prop-types
              selected={selector.state === VIEWS_PRIVATE}
              onSelect={() => {
                // eslint-disable-next-line react/prop-types
                selector.actions.Select(VIEWS_PRIVATE);
              }}>
              My views
            </Tab>
          </Tabs>
        </div>
        {/* eslint-disable-next-line react/prop-types */}
        <Views selected={selector.state} value={VIEWS_SHARED} component={sharedViews} />
        {/* eslint-disable-next-line react/prop-types */}
        <Views selected={selector.state} value={VIEWS_PRIVATE} component={privateViews} />
      </div>
    );
  }

  function saveCurrentView() {
    return SaveCurrentViewDialog({
      allowViewTypeSelection: entityFolders.shared.canEdit,
      allowRoleAssignment: roleAssignment,
    }).then((result) => {
      if (!result) {
        return;
      }

      const { title, isShared } = result;
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
