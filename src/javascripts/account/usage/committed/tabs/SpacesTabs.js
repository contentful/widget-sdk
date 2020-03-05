import React, { useState } from 'react';
import { Tabs, Tab, TabPanel } from '@contentful/forma-36-react-components';
import tokens from '@contentful/forma-36-tokens';
import { Grid, GridItem } from '../common/Grid';
import { css } from 'emotion';
import PropTypes from 'prop-types';
import SpacesTable from '../charts/SpacesTable';
import SpacesBarChart from '../charts/SpacesBarChart';
import { sum } from 'lodash';
import { periodicUsagePropType } from '../propTypes';

const styles = {
  tabPanel: css({
    paddingTop: tokens.spacing2Xl,
    paddingBottom: tokens.spacing2Xl
  })
};

const SpacesTabs = ({ spaceNames, period, periodicUsage }) => {
  const tabsData = [
    {
      id: 'cma',
      title: 'CMA Requests',
      defaultActive: true
    },
    {
      id: 'cda',
      title: 'CDA Requests'
    },
    {
      id: 'cpa',
      title: 'CPA Requests'
    },
    {
      id: 'gql',
      title: 'GraphQL Requests'
    }
  ];

  const colours = ['#2E75D4', '#0EB87F', '#EA9005', '#C7A544', '#CC3C52'];

  const defaultActiveTab = tabsData && tabsData.find(item => item.defaultActive);
  const [selected, setSelected] = useState(
    defaultActiveTab ? defaultActiveTab.id : tabsData[0]['id']
  );

  const handleSelected = id => {
    setSelected(id);
  };

  const apiName = selected.toUpperCase();
  const data = periodicUsage.apis[selected].items;
  const totalUsage = sum(periodicUsage.org.usage);

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
      <TabPanel id="api-usage-tab-panel" className={styles.tabPanel}>
        <Grid columns={'repeat(12, 1fr)'}>
          <GridItem columnStart={'span 4'}>
            <SpacesTable
              spaceNames={spaceNames}
              apiName={apiName}
              data={data}
              totalUsage={totalUsage}
              colours={colours}
            />
          </GridItem>
          <GridItem columnStart={'span 8'}>
            <SpacesBarChart spaceNames={spaceNames} period={period} data={data} colours={colours} />
          </GridItem>
        </Grid>
      </TabPanel>
    </>
  );
};

SpacesTabs.propTypes = {
  spaceNames: PropTypes.objectOf(PropTypes.string).isRequired,
  period: PropTypes.arrayOf(PropTypes.string).isRequired,
  periodicUsage: periodicUsagePropType.isRequired
};

export default SpacesTabs;
