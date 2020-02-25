import React, { useState } from 'react';
import { Tabs, Tab, TabPanel, Heading } from '@contentful/forma-36-react-components';
import tokens from '@contentful/forma-36-tokens';
import { css } from 'emotion';
import { Grid, GridItem } from './common/Grid';
import UsageTabs from './common/UsageTabs';

const styles = {
  panelHeading: css({
    fontWeight: tokens.fontWeightMedium,
    color: '#536171'
  }),
  spacesHeading: css({
    fontWeight: tokens.fontWeightMedium,
    color: '#6A7889',
    marginBottom: tokens.spacingXl
  })
};

const OrgTabs = props => (
  <>
    <UsageTabs
      tabsData={[
        {
          id: 'apiRequest',
          title: 'API Requests',
          defaultActive: true,
          leftComponent: (
            <Heading element="h2" className={styles.panelHeading}>
              Total API requests
            </Heading>
          ),
          rightComponent: <div>API Requests</div>
        },
        {
          id: 'assetBandwidth',
          title: 'Asset Bandwidth',
          leftComponent: (
            <Heading element="h2" className={styles.panelHeading}>
              Total API requests
            </Heading>
          ),
          rightComponent: <div>Asset Bandwidth</div>
        }
      ]}
    />
  </>
);

const SpacesTabs = props => {
  return (
    <>
      <Heading element="h2" className={styles.spacesHeading}>
        View API requests by type and space
      </Heading>

      <UsageTabs
        tabsData={[
          {
            id: 'cmaRequests',
            title: 'CMA Request',
            defaultActive: true,
            leftComponent: <div>Table</div>,
            rightComponent: <div>CMA Chart</div>
          },
          {
            id: 'cdaRequests',
            title: 'CDA Request',
            leftComponent: <div>Table</div>,
            rightComponent: <div>CDA Chart</div>
          },
          {
            id: 'cpaRequests',
            title: 'CPA Request',
            leftComponent: <div>Table</div>,
            rightComponent: <div>CPA Chart</div>
          },
          {
            id: 'gqlRequests',
            title: 'GraphQL Request',
            defaultActive: true,
            leftComponent: <div>Table</div>,
            rightComponent: <div>GraphQL Chart</div>
          }
        ]}
      />
    </>
  );
};

const OrganizationUsagePageNew = props => {
  return (
    <>
      <OrgTabs />
      <SpacesTabs />
    </>
  );
};

export default OrganizationUsagePageNew;
