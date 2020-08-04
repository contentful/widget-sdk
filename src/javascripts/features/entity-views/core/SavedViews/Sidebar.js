import React from 'react';
import PropTypes from 'prop-types';
import { css } from 'emotion';
import { Tabs, Tab, TabPanel } from '@contentful/forma-36-react-components';
import tokens from '@contentful/forma-36-tokens';

import { View } from './View';
import { useView, VIEWS_PRIVATE, VIEWS_SHARED } from './useView';

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
  wrapper: css({
    height: '100%',
    display: 'flex',
    flexGrow: 1,
    flexDirection: 'column',
    overflowY: 'hidden',
  }),
};

export const Sidebar = ({ entityType, onSelectSavedView, listViewContext }) => {
  const [
    selectedView,
    { setSharedViewSelected, setPrivateViewSelected, setSelectedView },
  ] = useView(VIEWS_SHARED);

  return (
    <div className={styles.wrapper}>
      <div className={styles.tabsWrapper}>
        <Tabs role="tablist">
          <Tab
            id={VIEWS_SHARED}
            testId={`${VIEWS_SHARED}-tab`}
            selected={selectedView === VIEWS_SHARED}
            onSelect={setSharedViewSelected}>
            Shared views
          </Tab>
          <Tab
            id={VIEWS_PRIVATE}
            testId={`${VIEWS_PRIVATE}-tab`}
            selected={selectedView === VIEWS_PRIVATE}
            onSelect={setPrivateViewSelected}>
            My views
          </Tab>
        </Tabs>
      </div>
      <TabPanel id={selectedView} key={selectedView} className={styles.tabPanel}>
        <View
          entityType={entityType}
          onSelectSavedView={onSelectSavedView}
          listViewContext={listViewContext}
          viewType={selectedView}
          setSelectedView={setSelectedView}
        />
      </TabPanel>
    </div>
  );
};

Sidebar.propTypes = {
  entityType: PropTypes.oneOf(['entry', 'asset']).isRequired,
  onSelectSavedView: PropTypes.func.isRequired,
  listViewContext: PropTypes.shape({
    getView: PropTypes.func.isRequired,
    setView: PropTypes.func.isRequired,
  }).isRequired,
};
