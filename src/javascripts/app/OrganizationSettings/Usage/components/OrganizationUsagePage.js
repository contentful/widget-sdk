import React, { useState, useEffect } from 'react';
import { Tabs, Tab, TabPanel, Heading } from '@contentful/forma-36-react-components';
import SpacesTabs from './SpacesTabs';
import OrganizationBarChart from './OrganizationBarChart';
import OrganizationUsageInfo from './OrganizationUsageInfo';
import AssetBandwidthSection from './AssetBandwidthSection';
import { Grid, GridItem } from './common/Grid';

import PropTypes from 'prop-types';
import { periodicUsagePropType, periodPropType } from '../propTypes';

import periodToDates from '../utils/periodToDates';
import { sum, get } from 'lodash';

import { css } from 'emotion';
import tokens from '@contentful/forma-36-tokens';

import { track } from 'analytics/Analytics';

const styles = {
  tabPanel: css({
    paddingTop: tokens.spacing2Xl,
    paddingBottom: tokens.spacing2Xl
  }),
  heading: css({
    color: '#6A7889',
    fontWeight: tokens.fontWeightNormal,
    paddingBottom: tokens.spacingXl,
    paddingTop: tokens.spacing2Xl
  })
};

const OrganizationUsagePage = ({
  spaceNames,
  period,
  periodicUsage,
  apiRequestIncludedLimit,
  assetBandwidthData,
  onTabSelect,
  isPoC
}) => {
  const orgUsage = periodicUsage.org.usage;
  const totalUsage = sum(orgUsage);
  const dates = periodToDates(period);

  const [selected, setSelected] = useState('apiRequest');
  const [currentAssetBandwidthData, setCurrentBandwidthData] = useState();

  const handleSelected = id => {
    track('usage:org_tab_selected', { old: selected, new: id });
    setSelected(id);
    onTabSelect(id);
  };

  useEffect(() => {
    const data = {
      usage: get(assetBandwidthData, ['usage']),
      limit: get(assetBandwidthData, ['limits', 'included']),
      uom: get(assetBandwidthData, ['unitOfMeasure'])
    };
    setCurrentBandwidthData(data);
    // eslint-disable-next-line
  }, []);

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
              <OrganizationUsageInfo
                totalUsage={totalUsage}
                includedLimit={apiRequestIncludedLimit}
              />
            </GridItem>
            <GridItem columnStart="span 8">
              <OrganizationBarChart
                period={dates}
                usage={orgUsage}
                includedLimit={apiRequestIncludedLimit}
              />
            </GridItem>
          </Grid>
          <Heading element="h2" className={styles.heading}>
            View API requests by type and space
          </Heading>
          <SpacesTabs
            period={dates}
            spaceNames={spaceNames}
            periodicUsage={periodicUsage}
            isPoC={isPoC}
          />
        </TabPanel>
      )}
      {selected === 'assetBandwidth' && (
        <TabPanel id="assetBandwidth" className={styles.tabPanel}>
          <Grid columns={'repeat(12, 1fr)'}>
            <GridItem columnStart="span 12">
              {currentAssetBandwidthData.usage !== null && (
                <AssetBandwidthSection {...currentAssetBandwidthData} />
              )}
            </GridItem>
          </Grid>
        </TabPanel>
      )}
    </>
  );
};

OrganizationUsagePage.propTypes = {
  spaceNames: PropTypes.objectOf(PropTypes.string).isRequired,
  periodicUsage: periodicUsagePropType.isRequired,
  period: periodPropType,
  apiRequestIncludedLimit: PropTypes.number.isRequired,
  assetBandwidthData: PropTypes.shape({
    usage: PropTypes.number,
    unitOfMeasure: PropTypes.string,
    limits: PropTypes.shape({
      included: PropTypes.number
    })
  }),
  isPoC: PropTypes.objectOf(PropTypes.bool).isRequired,
  onTabSelect: PropTypes.func
};

export default OrganizationUsagePage;
