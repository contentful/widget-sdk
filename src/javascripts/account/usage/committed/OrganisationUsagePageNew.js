import React, { useState } from 'react';
import { Tabs, Tab, TabPanel, Heading } from '@contentful/forma-36-react-components';
import tokens from '@contentful/forma-36-tokens';
import { css } from 'emotion';
import {Grid, GridItem} from './common/Grid';

const styles = {
  tabPanel: css({
    paddingTop: tokens.spacing2Xl,
    paddingBottom: tokens.spacing2Xl
  }),
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

const OrgTabs = (props) => {
  const [selected, setSelected] = useState('apiRequest');

  const handleSelected = (id) => {
    setSelected(id)
  }

  return (
    <>
      <Tabs
        withDivider={true}
      >
        <Tab
          id="apiRequest"
          selected={selected === 'apiRequest'}
          onSelect={handleSelected}
        >
          API Requests
        </Tab>
        <Tab
          id="assetBandwidth"
          selected={selected === 'assetBandwidth'}
          onSelect={handleSelected}
        >
          Asset Bandwidth
        </Tab>
      </Tabs>
      {selected === 'apiRequest' && (
        <TabPanel id="apiRequest" className={styles.tabPanel}>
          <Grid columns={'repeat(auto-fill, minmax(100px, 1fr))'}>
            <GridItem columnStart={1} columnEnd={5}>
              <Heading element='h2' className={styles.panelHeading}>Total API requests</Heading>
            </GridItem>
            <GridItem columnStart={5} columnEnd={12}>
              CHART
            </GridItem>
          </Grid>
        </TabPanel>
      )}
      {selected === 'assetBandwidth' && (
        <TabPanel id="assetBandwidth" className={styles.tabPanel}>content asset bandwidth chart</TabPanel>
      )}
    </>
  )
}

const SpacesTabs = (props) => {

  const [selected, setSelected] = useState('cmaRequests');

  const handleSelected = (id) => {
    setSelected(id)
  }

  return (
    <>
      <Heading element='h2' className={styles.spacesHeading}>View API requests by type and space</Heading>
      <Tabs
        withDivider={true}
      >
        <Tab
          id="cmaRequests"
          selected={selected === 'cmaRequests'}
          onSelect={handleSelected}
        >
          CMA Requests
        </Tab>
        <Tab
          id="cdaRequests"
          selected={selected === 'cdaRequests'}
          onSelect={handleSelected}
        >
          CDA Requests
        </Tab>
        <Tab
          id="cpaRequests"
          selected={selected === 'cpaRequests'}
          onSelect={handleSelected}
        >
          CPA Requests
        </Tab>
        <Tab
          id="gqlRequests"
          selected={selected === 'gqlRequests'}
          onSelect={handleSelected}
        >
          GraphQL Requests
        </Tab>
      </Tabs>
      {selected === 'cmaRequests' && (
        <TabPanel id="cmaRequests" className={styles.tabPanel}>
          <Grid columns={'repeat(auto-fill, minmax(100px, 1fr))'}>
            <GridItem columnStart={1} columnEnd={5}>
              <Heading element='h2' className={styles.panelHeading}>Total API requests</Heading>
            </GridItem>
            <GridItem columnStart={5} columnEnd={12}>CHART</GridItem>
          </Grid>
        </TabPanel>
      )}
      {selected === 'cdaRequests' && (
        <TabPanel id="cdaRequests" className={styles.tabPanel}>
          <Grid columns={'repeat(auto-fill, minmax(100px, 1fr))'}>
            <GridItem columnStart={1} columnEnd={5}>Table</GridItem>
            <GridItem columnStart={5} columnEnd={12}>CHART</GridItem>
          </Grid>
        </TabPanel>
      )}
      {selected === 'cpaRequests' && (
        <TabPanel id="cpaRequests" className={styles.tabPanel}>
          <Grid columns={'repeat(auto-fill, minmax(100px, 1fr))'}>
            <GridItem columnStart={1} columnEnd={5}>Table</GridItem>
            <GridItem columnStart={5} columnEnd={12}>CHART</GridItem>
          </Grid>
        </TabPanel>
      )}
      {selected === 'gqlRequests' && (
        <TabPanel id='gqlRequests' className={styles.tabPanel}>
          <Grid columns={'repeat(auto-fill, minmax(100px, 1fr))'}>
            <GridItem columnStart={1} columnEnd={5}>Table</GridItem>
            <GridItem columnStart={5} columnEnd={12}>CHART</GridItem>
          </Grid>
        </TabPanel>
      )}
    </>
  )
}

const OrganizationUsagePageNew = (props) => {
  return(
    <>
      <OrgTabs />
      <SpacesTabs />
    </>
  )
}

export default OrganizationUsagePageNew;
