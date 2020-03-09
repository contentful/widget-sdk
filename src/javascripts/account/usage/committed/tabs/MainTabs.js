import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { Tabs, Tab, TabPanel } from '@contentful/forma-36-react-components';
import tokens from '@contentful/forma-36-tokens';
import { sum, get } from 'lodash';
import { Grid, GridItem } from '../common/Grid';
import { css } from 'emotion';
import SpacesTabs from './SpacesTabs';
import { Heading } from '@contentful/forma-36-react-components';
import OrganizationBarChart from '../charts/OrganizationBarChart';
import OrganizationUsageInfoNew from '../OrganizationUsageInfoNew';
import AssetBandwidthSection from '../AssetBandwidthSectionNew';
import { periodicUsagePropType } from '../propTypes';

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

const MainTabs = props => {
  const { period, periodicUsage, apiRequestIncludedLimit, assetBandwidthData, spaceNames } = props;

  const orgUsage = periodicUsage.org.usage;
  const totalUsage = sum(orgUsage);

  const [selected, setSelected] = useState('apiRequest');

  const handleSelected = setSelected;

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
          <Heading element="h2" className={styles.heading}>
            View API requests by type and space
          </Heading>
          <SpacesTabs period={period} spaceNames={spaceNames} periodicUsage={periodicUsage} />
        </TabPanel>
      )}
      {selected === 'assetBandwidth' && (
        <TabPanel id="assetBandwidth" className={styles.tabPanel}>
          <Grid columns={'repeat(12, 1fr)'}>
            <GridItem columnStart="span 12">
              <AssetBandwidthSection
                limit={get(assetBandwidthData, ['limits', 'included'])}
                usage={get(assetBandwidthData, ['usage'])}
                uom={get(assetBandwidthData, ['unitOfMeasure'])}
              />
            </GridItem>
          </Grid>
        </TabPanel>
      )}
    </>
  );
};

MainTabs.propTypes = {
  period: PropTypes.arrayOf(PropTypes.string).isRequired,
  periodicUsage: periodicUsagePropType.isRequired,
  apiRequestIncludedLimit: PropTypes.number.isRequired,
  spaceNames: PropTypes.objectOf(PropTypes.string).isRequired,
  assetBandwidthData: PropTypes.shape({
    usage: PropTypes.number,
    unitOfMeasure: PropTypes.string,
    limits: PropTypes.shape({
      included: PropTypes.number
    })
  })
};

export default MainTabs;
