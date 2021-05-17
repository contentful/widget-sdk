import React, { useState, useEffect } from 'react';
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
  // Feature flag that enables space creation for Enterprise customers
  isCreateSpaceForSpacePlanEnabled?: boolean;
  // Feature flag that enables space plan assignment experiment
  isSpacePlanAssignmentExperimentEnabled: boolean;
  // Function to be called when space plan changes (upgrade or downgrade)
  onChangeSpace: () => void;
  // Function to be called when space plan is deleted
  onDeleteSpace: (plan: SpacePlan) => () => void;
  // The id of the current organization
  organizationId: string;
  // Array of space plans, it's used by the component to create the space plans’ table
  spacePlans: SpacePlan[];
  // It tells the component if this user can see the UI with "Used Spaces/Unused Spaces" tabs
  userCanManageSpaces: boolean;
}

export function UsedAndUnusedSpacePlans({
  changedSpaceId,
  isCreateSpaceForSpacePlanEnabled,
  isSpacePlanAssignmentExperimentEnabled,
  onChangeSpace,
  onDeleteSpace,
  organizationId,
  spacePlans,
  userCanManageSpaces,
}: UsedAndUnusedSpacePlansProps) {
  const [selectedTab, setSelectedTab] = useState<EnterpriseSpacesTabs>(
    EnterpriseSpacesTabs.USED_SPACES
  );

  // Enterprise admin or owners can manage used and unused spaces
  const [usedSpacePlans, setUsedSpacePlans] = useState<SpacePlan[]>([]);
  const [unusedSpacePlans, setUnusedSpacePlans] = useState<SpacePlan[]>([]);

  useEffect(() => {
    if (userCanManageSpaces) {
      const assignedSpacePlans = spacePlans.filter((plan) => plan.gatekeeperKey !== null);
      const unassignedSpacePlans = spacePlans
        .filter((plan) => plan.gatekeeperKey === null)
        .sort((plan1, plan2) => plan1.price - plan2.price);

      setUsedSpacePlans(assignedSpacePlans);
      setUnusedSpacePlans(unassignedSpacePlans);
    }
  }, [userCanManageSpaces, spacePlans]);

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
        <UnassignedPlansTable
          organizationId={organizationId}
          plans={unusedSpacePlans}
          spaceAssignmentExperiment={isSpacePlanAssignmentExperimentEnabled}
          canCreateSpaceWithPlan={isCreateSpaceForSpacePlanEnabled}
        />
      </TabPanel>
    </>
  );
}
