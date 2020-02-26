import React, { useState } from 'react';
import { Tabs, Tab, TabPanel } from '@contentful/forma-36-react-components';
import tokens from '@contentful/forma-36-tokens';
import { Grid, GridItem } from './Grid';
import { css } from 'emotion';
import PropTypes from 'prop-types';

const styles = {
  tabPanel: css({
    paddingTop: tokens.spacing2Xl,
    paddingBottom: tokens.spacing2Xl
  })
};

const UsageTabs = props => {
  const { tabsData } = props;
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
      {tabsData &&
        tabsData.map((item, idx) => (
          <>
            {selected === item.id && (
              <TabPanel key={`${item.id}${idx}`} id={item.id} className={styles.tabPanel}>
                <Grid columns={'repeat(12, 1fr)'}>
                  <GridItem columnStart={'span 4'}>{item.leftComponent}</GridItem>
                  <GridItem columnStart={'span 8'}>{item.rightComponent}</GridItem>
                </Grid>
              </TabPanel>
            )}
          </>
        ))}
    </>
  );
};

UsageTabs.propTypes = {
  tabsData: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      title: PropTypes.string.isRequired,
      defaultActive: PropTypes.boolean,
      leftComponent: PropTypes.elementType.isRequired,
      rightComponent: PropTypes.elementType.isRequired
    })
  )
};

export default UsageTabs;
