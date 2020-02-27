import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { Tabs, Tab, TabPanel } from '@contentful/forma-36-react-components';
import tokens from '@contentful/forma-36-tokens';
import { sum } from 'lodash';
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
  const { period, periodicUsage, apiRequestIncludedLimit } = props;

  const orgUsage = periodicUsage.org.usage;
  const totalUsage = sum(orgUsage);
  const tabsData = [
    {
      id: 'apiRequest',
      title: 'API Requests',
      defaultActive: true,
      leftComponent: (
        <OrganizationUsageInfo totalUsage={totalUsage} includedLimit={apiRequestIncludedLimit} />
      ),
      rightComponent: <OrganisationBarChart period={period} usage={orgUsage} />
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

OrgTabs.propTypes = {
  period: PropTypes.object,
  periodicUsage: PropTypes.object,
  apiRequestIncludedLimit: PropTypes.number
};

export default OrgTabs;
