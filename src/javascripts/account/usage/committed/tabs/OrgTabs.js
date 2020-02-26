import React, { useState } from 'react';
import { Tabs, Tab, TabPanel } from '@contentful/forma-36-react-components';
import tokens from '@contentful/forma-36-tokens';
import { Grid, GridItem } from '../common/Grid';
import { css } from 'emotion';
import OrganisationBarChart from '../charts/OrganisationBarChart';
import OrganizationUsageInfo from '../OrganizationUsageInfo';
import AssetBandwidthSection from '../AssetBandwidthSection';

const styles = {
  tabPanel: css({
    paddingTop: tokens.spacing2Xl,
    paddingBottom: tokens.spacing2Xl
  })
};

const OrgTabs = props => {
  const tabsData = [
    {
      id: 'apiRequest',
      title: 'API Requests',
      defaultActive: true,
      leftComponent: <OrganizationUsageInfo totalUsage={2150} includedLimit={200} />,
      rightComponent: <OrganisationBarChart chartData={props} />
    },
    {
      id: 'assetBandwidth',
      title: 'Asset Bandwidth',
      leftComponent: <AssetBandwidthSection />,
      rightComponent: <div>Asset Bandwidth</div>
    }
  ];

  const defaultActiveTabIndex = tabsData && tabsData.findIndex(item => item.defaultActive);
  const [selected, setSelected] = useState(
    defaultActiveTabIndex === -1 ? 0 : defaultActiveTabIndex
  );

  const handleSelected = id => {
    setSelected(id);
  };

  return (
    <>
      <Tabs withDivider={true}>
        {tabsData &&
          tabsData.map(item => (
            <Tab
              id={item.id}
              key={item.id}
              selected={selected === item.id}
              onSelect={handleSelected}>
              {item.title}
            </Tab>
          ))}
      </Tabs>
      <TabPanel id={tabsData[selected].id} className={styles.tabPanel}>
        <Grid columns={'repeat(12, 1fr)'}>
          <GridItem columnStart={'span 4'}>{tabsData[selected].leftComponent}</GridItem>
          <GridItem columnStart={'span 8'}>{tabsData[selected].rightComponent}</GridItem>
        </Grid>
      </TabPanel>
    </>
  );
};

export default OrgTabs;
