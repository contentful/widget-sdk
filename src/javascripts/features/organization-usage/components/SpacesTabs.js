import React from 'react';
import { Tabs, Tab, TabPanel } from '@contentful/forma-36-react-components';
import tokens from '@contentful/forma-36-tokens';
import { Grid, GridItem } from '@contentful/forma-36-react-components/dist/alpha';
import { css } from 'emotion';
import { SpacesTable } from './SpacesTable';
import { SpacesBarChart } from './SpacesBarChart';

import { track } from 'analytics/Analytics';
import { useUsageState, useUsageDispatch } from '../hooks/usageContext';

const styles = {
  tabPanel: css({
    paddingTop: tokens.spacing2Xl,
    paddingBottom: tokens.spacing2Xl,
  }),
};

const tabsData = [
  {
    id: 'cma',
    title: 'CMA Requests',
  },
  {
    id: 'cda',
    title: 'CDA Requests',
  },
  {
    id: 'cpa',
    title: 'CPA Requests',
  },
  {
    id: 'gql',
    title: 'GraphQL Requests',
  },
];

export const SpacesTabs = () => {
  const { selectedSpacesTab } = useUsageState();
  const dispatch = useUsageDispatch();

  const handleSelected = (id) => {
    track('usage:space_tab_selected', { old: selectedSpacesTab, new: id });
    dispatch({ type: 'SWITCH_SPACES_TAB', value: id });
  };

  return (
    <>
      <Tabs withDivider={true}>
        {tabsData.map((item) => (
          <Tab
            id={item.id}
            key={item.id}
            selected={selectedSpacesTab === item.id}
            onSelect={handleSelected}>
            {item.title}
          </Tab>
        ))}
      </Tabs>
      <TabPanel id="api-usage-tab-panel" className={styles.tabPanel}>
        <Grid columns={'1fr 2fr'}>
          <GridItem>
            <SpacesTable />
          </GridItem>
          <GridItem>
            <SpacesBarChart />
          </GridItem>
        </Grid>
      </TabPanel>
    </>
  );
};
