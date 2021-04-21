import { RoleEditRoutes } from '../routes/RoleEditorRoute';
import { Tab, Tabs } from '@contentful/forma-36-react-components';
import React from 'react';
import { useParams } from 'core/react-routing';
import { css } from 'emotion';
import tokens from '@contentful/forma-36-tokens';

const styles = {
  tabs: css({
    overflowX: 'auto',
    display: 'flex',
    paddingLeft: tokens.spacing2Xl,
  }),
};

export function RoleEditorTabs({ navigateToTab }: { navigateToTab: (tab: string) => void }) {
  const { tab: activeTab } = useParams();

  return (
    <Tabs withDivider className={styles.tabs}>
      {Object.keys(RoleEditRoutes).map((key) => {
        const tab = RoleEditRoutes[key];
        return (
          <Tab
            id={tab.name}
            key={tab.name}
            selected={tab.name === activeTab}
            onSelect={navigateToTab}>
            {tab.label}
          </Tab>
        );
      })}
    </Tabs>
  );
}
