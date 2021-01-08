import React from 'react';
import { Tabs, Tab, TabPanel, Heading } from '@contentful/forma-36-react-components';
import { Grid, GridItem } from '@contentful/forma-36-react-components';
import { SpacesTabs } from './SpacesTabs';
import { OrganizationBarChart } from './OrganizationBarChart';
import { OrganizationUsageInfo } from './OrganizationUsageInfo';
import { AssetBandwidthSection } from './AssetBandwidthSection';

import { css } from 'emotion';
import tokens from '@contentful/forma-36-tokens';

import { track } from 'analytics/Analytics';
import { useUsageState, useUsageDispatch } from '../hooks/usageContext';

const styles = {
  tabPanel: css({
    paddingTop: tokens.spacing2Xl,
    paddingBottom: tokens.spacing2Xl,
  }),
  heading: css({
    color: '#6A7889',
    fontWeight: tokens.fontWeightNormal,
    paddingBottom: tokens.spacingXl,
    paddingTop: tokens.spacing2Xl,
  }),
};

export const OrganizationUsagePage = () => {
  const { selectedMainTab, isAssetBandwidthTab } = useUsageState();
  const dispatch = useUsageDispatch();

  const handleSelected = (id) => {
    track('usage:org_tab_selected', { old: selectedMainTab, new: id });
    dispatch({ type: 'SWITCH_MAIN_TAB', value: id });
  };

  return (
    <>
      <Tabs withDivider>
        <Tab id="apiRequest" selected={!isAssetBandwidthTab} onSelect={handleSelected}>
          API Requests
        </Tab>
        <Tab
          testId="organization-usage_asset-bandwidth-tab"
          id="assetBandwidth"
          selected={isAssetBandwidthTab}
          onSelect={handleSelected}>
          Asset Bandwidth
        </Tab>
      </Tabs>

      {!isAssetBandwidthTab && (
        <TabPanel id="apiRequest" className={styles.tabPanel}>
          <Grid columns={'1fr 2fr'}>
            <GridItem>
              <OrganizationUsageInfo />
            </GridItem>
            <GridItem>
              <OrganizationBarChart />
            </GridItem>
          </Grid>
          <Heading element="h2" className={styles.heading}>
            View API requests by type and space
          </Heading>
          <SpacesTabs />
        </TabPanel>
      )}
      {isAssetBandwidthTab && (
        <TabPanel id="assetBandwidth" className={styles.tabPanel}>
          <Grid columns={1}>
            <GridItem>
              <AssetBandwidthSection />
            </GridItem>
          </Grid>
        </TabPanel>
      )}
    </>
  );
};
