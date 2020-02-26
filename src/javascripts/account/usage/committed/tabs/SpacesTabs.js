import React, { useState } from 'react';
import { Tabs, Tab, TabPanel } from '@contentful/forma-36-react-components';
import tokens from '@contentful/forma-36-tokens';
import { Grid, GridItem } from '../common/Grid';
import { css } from 'emotion';
import PropTypes from 'prop-types';

const styles = {
  tabPanel: css({
    paddingTop: tokens.spacing2Xl,
    paddingBottom: tokens.spacing2Xl
  })
};

const SpacesTab = props => {
  const tabsData = [
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
  ];

  const { periods } = props;
  const defaultActiveTab = tabsData && tabsData.find(item => item.defaultActive);
  const [selected, setSelected] = useState(
    defaultActiveTab ? defaultActiveTab.id : tabsData[0]['id']
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
      <TabPanel id="ID_IS_A_MUST" className={styles.tabPanel}>
        <Grid columns={'repeat(12, 1fr)'}>
          <GridItem columnStart={'span 4'}>{/* <SpaceTable /> */}</GridItem>
          <GridItem columnStart={'span 8'}>
            {periods}
            {/* <Charts periods={periods} usage={''} spaceName={''} /> */}
          </GridItem>
        </Grid>
      </TabPanel>
    </>
  );
};

SpacesTab.propTypes = {
  tabsData: PropTypes.string,
  periods: PropTypes.array
};

export default SpacesTab;
