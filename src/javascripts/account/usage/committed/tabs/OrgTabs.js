import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { Tabs, Tab, TabPanel } from '@contentful/forma-36-react-components';
import tokens from '@contentful/forma-36-tokens';
import { sum } from 'lodash';
import { Grid, GridItem } from '../common/Grid';
import { css } from 'emotion';
import OrganizationBarChart from '../charts/OrganizationBarChart';
import OrganizationUsageInfoNew from '../OrganizationUsageInfoNew';
import AssetBandwidthSection from '../AssetBandwidthSection';
import { periodicUsagePropType } from '../propTypes';

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

  const [selected, setSelected] = useState('apiRequest');

  const handleSelected = idx => {
    setSelected(idx);
  };

  return (
    <>
      <Tabs withDivider>
        <Tab id="apiRequest" selected={selected === 'apiRequest'} onSelect={handleSelected}>
          API Requests
        </Tab>
        <Tab id="assetBandwidth" selected={selected === 'assetBandwidth'} onSelect={handleSelected}>
          Asset Bandwidth
        </Tab>
      </Tabs>

      {selected === 'apiRequest' && (
        <TabPanel id="apiRequest" className={styles.tabPanel}>
          <Grid columns={'repeat(12, 1fr)'}>
            <GridItem columnStart="span 4">
              <OrganizationUsageInfoNew
                totalUsage={totalUsage}
                includedLimit={apiRequestIncludedLimit}
              />
            </GridItem>
            <GridItem columnStart="span 8">
              <OrganizationBarChart period={period} usage={orgUsage} />
            </GridItem>
          </Grid>
        </TabPanel>
      )}
      {selected === 'assetBandwidth' && (
        <TabPanel id="assetBandwidth" className={styles.tabPanel}>
          <Grid columns={'repeat(12, 1fr)'}>
            <GridItem columnStart="span 12">
              <AssetBandwidthSection />
            </GridItem>
          </Grid>
        </TabPanel>
      )}
    </>
  );
};

OrgTabs.propTypes = {
  period: PropTypes.arrayOf(PropTypes.string).isRequired,
  periodicUsage: periodicUsagePropType.isRequired,
  apiRequestIncludedLimit: PropTypes.number.isRequired
};

export default OrgTabs;
