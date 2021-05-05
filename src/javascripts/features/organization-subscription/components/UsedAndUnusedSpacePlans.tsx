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
  initialLoad?: boolean;
  usedSpacePlans: SpacePlan[];
  unusedSpacePlans: SpacePlan[];
  organizationId: string;
  changedSpaceId?: string;
  onDeleteSpace: (plan: SpacePlan) => () => void;
  onChangeSpace: () => void;
  enterprisePlan: boolean;
  isSpacePlanAssignmentExperimentEnabled: boolean;
  isCreateSpaceForSpacePlanEnabled: boolean;
}

export function UsedAndUnusedSpacePlans({
  initialLoad = false,
  usedSpacePlans,
  unusedSpacePlans,
  organizationId,
  changedSpaceId,
  onDeleteSpace,
  onChangeSpace,
  enterprisePlan,
  isSpacePlanAssignmentExperimentEnabled,
  isCreateSpaceForSpacePlanEnabled,
}: UsedAndUnusedSpacePlansProps) {
  const [selectedTab, setSelectedTab] = useState<EnterpriseSpacesTabs>(
    EnterpriseSpacesTabs.USED_SPACES
  );

  // If the org has no unused spaces, we do not need the tabs UI
  if (unusedSpacePlans.length === 0) {
    return (
      <SpacePlansTable
        enterprisePlan={enterprisePlan}
        initialLoad={initialLoad}
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
          plans={usedSpacePlans}
          organizationId={organizationId}
          initialLoad={initialLoad}
          upgradedSpaceId={changedSpaceId}
          onChangeSpace={onChangeSpace}
          onDeleteSpace={onDeleteSpace}
          enterprisePlan={enterprisePlan}
          showSpacePlanChangeBtn
        />
      </TabPanel>

      <TabPanel
        id={EnterpriseSpacesTabs.UNUSED_SPACES}
        className={cx(styles.tabPanel, {
          [styles.isVisible]: selectedTab === EnterpriseSpacesTabs.UNUSED_SPACES,
        })}>
        <UnassignedPlansTable
          plans={unusedSpacePlans}
          initialLoad={initialLoad}
          spaceAssignmentExperiment={isSpacePlanAssignmentExperimentEnabled}
          canCreateSpaceWithPlan={isCreateSpaceForSpacePlanEnabled}
        />
      </TabPanel>
    </>
  );
}
