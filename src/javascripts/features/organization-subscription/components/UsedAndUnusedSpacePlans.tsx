import React, { useState } from 'react';
import { css, cx } from 'emotion';
import { Tabs, Tab, TabPanel } from '@contentful/forma-36-react-components';
import tokens from '@contentful/forma-36-tokens';

import { UnassignedPlansTable } from '../space-usage-summary/UnassignedPlansTable';
import { SpacePlansTable } from '../space-usage-summary/SpacePlansTable';
import type { SpacePlan } from '../types';

const styles = {
  tabPanel: css({
    display: 'none',
    height: '100%',
  }),
  isVisible: css({
    display: 'block',
    padding: `${tokens.spacingM} 0 0 0`,
  }),
};

enum EnterpriseSpacesTabs {
  USED_SPACES = 'usedSpaces',
  UNUSED_SPACES = 'unusedSpaces',
}

interface UsedAndUnusedSpacePlansProps {
  // Id of a space plan that got deleted, upgraded, or downgraded
  changedSpaceId?: string;
  // Function to be called when space plan changes (upgrade or downgrade)
  onChangeSpace: () => void;
  // function to generate the the correct onDelete function for each SpacePlanRow
  onDeleteSpace: (plan: SpacePlan) => () => void;
  // The id of the current organization
  organizationId: string;
  // Array of space plans, it's used by the component to create the space plans’ table
  spacePlans: SpacePlan[];
}

export function UsedAndUnusedSpacePlans({
  changedSpaceId,
  onChangeSpace,
  onDeleteSpace,
  organizationId,
  spacePlans,
}: UsedAndUnusedSpacePlansProps) {
  const [selectedTab, setSelectedTab] = useState<EnterpriseSpacesTabs>(
    EnterpriseSpacesTabs.USED_SPACES
  );

  // Enterprise admin or owners can manage used and unused spaces
  const usedSpacePlans = spacePlans.filter((plan) => plan.gatekeeperKey !== null);
  const unusedSpacePlans = spacePlans
    .filter((plan) => plan.gatekeeperKey === null)
    .sort((plan1, plan2) => plan1.price - plan2.price);

  // If the org has no unused spaces, we do not need the tabs UI
  if (unusedSpacePlans.length === 0) {
    return (
      <SpacePlansTable
        enterprisePlan
        onChangeSpace={onChangeSpace}
        onDeleteSpace={onDeleteSpace}
        organizationId={organizationId}
        plans={usedSpacePlans}
        upgradedSpaceId={changedSpaceId}
        showSpacePlanChangeBtn
      />
    );
  }

  return (
    <>
      <Tabs withDivider>
        <Tab
          key={EnterpriseSpacesTabs.USED_SPACES}
          id={EnterpriseSpacesTabs.USED_SPACES}
          testId={`tab-${EnterpriseSpacesTabs.USED_SPACES}`}
          selected={selectedTab === EnterpriseSpacesTabs.USED_SPACES}
          onSelect={() => setSelectedTab(EnterpriseSpacesTabs.USED_SPACES)}>
          Used spaces
        </Tab>
        <Tab
          key={EnterpriseSpacesTabs.UNUSED_SPACES}
          id={EnterpriseSpacesTabs.UNUSED_SPACES}
          testId={`tab-${EnterpriseSpacesTabs.UNUSED_SPACES}`}
          selected={selectedTab === EnterpriseSpacesTabs.UNUSED_SPACES}
          onSelect={() => setSelectedTab(EnterpriseSpacesTabs.UNUSED_SPACES)}>
          Unused spaces ({unusedSpacePlans.length})
        </Tab>
      </Tabs>

      <TabPanel
        id={EnterpriseSpacesTabs.USED_SPACES}
        className={cx(styles.tabPanel, {
          [styles.isVisible]: selectedTab === EnterpriseSpacesTabs.USED_SPACES,
        })}>
        <SpacePlansTable
          enterprisePlan
          plans={usedSpacePlans}
          organizationId={organizationId}
          upgradedSpaceId={changedSpaceId}
          onChangeSpace={onChangeSpace}
          onDeleteSpace={onDeleteSpace}
          showSpacePlanChangeBtn
        />
      </TabPanel>

      <TabPanel
        id={EnterpriseSpacesTabs.UNUSED_SPACES}
        className={cx(styles.tabPanel, {
          [styles.isVisible]: selectedTab === EnterpriseSpacesTabs.UNUSED_SPACES,
        })}>
        <UnassignedPlansTable organizationId={organizationId} plans={unusedSpacePlans} />
      </TabPanel>
    </>
  );
}
