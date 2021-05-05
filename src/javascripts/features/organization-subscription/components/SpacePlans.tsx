import React, { useCallback, useState, useEffect, useContext } from 'react';
import { css } from 'emotion';
import {
  Paragraph,
  Flex,
  Heading,
  TextLink,
  Tooltip,
  Icon,
  Button,
  Notification,
} from '@contentful/forma-36-react-components';
import tokens from '@contentful/forma-36-tokens';

import { getVariation, FLAGS } from 'LaunchDarkly';
import StateLink from 'app/common/StateLink';
import { track } from 'analytics/Analytics';
import { Pluralized, Price } from 'core/components/formatting';
import { useAsync } from 'core/hooks';
import { openDeleteSpaceDialog } from 'features/space-settings';
import { calculatePlansCost } from 'utils/SubscriptionUtils';

import { SpacePlansTable } from '../space-usage-summary/SpacePlansTable';
import { UsedAndUnusedSpacePlans } from './UsedAndUnusedSpacePlans';

import { OrgSubscriptionContext } from '../context';
import { actions } from '../context/orgSubscriptionReducer';
import { createSpace, changeSpace } from '../utils/spaceUtils';
import { downloadSpacesUsage } from '../services/SpacesUsageService';
import type { SpacePlan } from '../types';
import { useChangedSpace } from '../hooks/useChangedSpace';

const styles = {
  inaccessibleHelpIcon: css({
    fill: tokens.colorElementDarkest,
    marginBottom: '-3px',
    marginLeft: tokens.spacingXs,
  }),
  exportButton: css({
    marginLeft: 'auto',
  }),
};

async function fetchFeatureFlags(isEnterprisePlan: boolean, organizationId: string) {
  // we only need the flags for organizations with Enterprise basePlan
  if (!isEnterprisePlan) {
    return undefined;
  }

  const [
    isSpacePlanAssignmentEnabled,
    isCreateSpaceForSpacePlanEnabled,
    isSpacePlanAssignmentExperimentEnabled,
  ] = await Promise.all([
    getVariation(FLAGS.SPACE_PLAN_ASSIGNMENT, { organizationId }),
    getVariation(FLAGS.CREATE_SPACE_FOR_SPACE_PLAN),
    getVariation(FLAGS.SPACE_PLAN_ASSIGNMENT_EXPERIMENT, { organizationId }),
  ]);

  return {
    isSpacePlanAssignmentEnabled,
    isCreateSpaceForSpacePlanEnabled,
    isSpacePlanAssignmentExperimentEnabled,
  };
}

interface SpacePlansProps {
  enterprisePlan?: boolean;
  initialLoad?: boolean;
  isOwnerOrAdmin?: boolean;
  organizationId: string;
}

export function SpacePlans({
  enterprisePlan = false,
  initialLoad = false,
  isOwnerOrAdmin = false,
  organizationId,
}: SpacePlansProps) {
  const {
    dispatch,
    state: { spacePlans },
  } = useContext(OrgSubscriptionContext);

  const { changedSpaceId, setChangedSpaceId } = useChangedSpace();

  const [usedSpacePlans, setUsedSpacePlans] = useState<SpacePlan[]>([]);
  const [unusedSpacePlans, setUnusedSpacePlans] = useState<SpacePlan[]>([]);

  const [isExportingCSV, setIsExportingCSV] = useState(false);

  // fetch feature flags
  const { isLoading, data } = useAsync(
    useCallback(() => fetchFeatureFlags(enterprisePlan, organizationId), [
      enterprisePlan,
      organizationId,
    ])
  );

  // Enterprise admin or owners can manage used and unused spaces
  const userCanManageSpaces =
    data?.isSpacePlanAssignmentEnabled && enterprisePlan && isOwnerOrAdmin;

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

  // Space CRUD functions
  const onCreateSpace = createSpace(organizationId);
  const onChangeSpace = changeSpace(
    organizationId,
    spacePlans,
    (newSpacePlans) => dispatch({ type: actions.SET_SPACE_PLANS, payload: newSpacePlans }),
    setChangedSpaceId
  );
  const onDeleteSpace = (plan) => () => {
    openDeleteSpaceDialog({
      plan,
      space: plan.space,
      onSuccess: () => dispatch({ type: actions.DELETE_SPACE, payload: plan.space.sys.id }),
    });
  };

  // Export CSV
  const handleExportBtnClick = async () => {
    setIsExportingCSV(true);
    try {
      track('space_usage_summary:export');
      await downloadSpacesUsage(organizationId);
    } catch {
      Notification.error('Could not export the space usage.');
    }
    setIsExportingCSV(false);
  };

  const numSpaces = spacePlans.length;
  const hasAnySpacesInaccessible = spacePlans.some((plan) => !plan.space?.isAccessible);
  const showExportBtn = !isLoading && spacePlans.length > 0;
  const totalCost = calculatePlansCost({ plans: spacePlans });

  return (
    <>
      <Heading className="section-title">
        Spaces
        {hasAnySpacesInaccessible && (
          <Tooltip
            testId="inaccessible-help-tooltip"
            content={
              <>
                You can’t see usage or content for spaces you’re not a member of. You can add
                yourself to these spaces in the organization users settings.
              </>
            }>
            <Icon
              testId="inaccessible-help-icon"
              icon="HelpCircle"
              className={styles.inaccessibleHelpIcon}
            />
          </Tooltip>
        )}
      </Heading>

      <Flex alignItems="center" marginBottom="spacingM">
        <Paragraph testId="subscription-page.organization-information">
          {numSpaces > 0 ? (
            <>
              Your organization has{' '}
              <b>
                <Pluralized text="space" count={numSpaces} />
              </b>
              {'. '}
            </>
          ) : (
            "Your organization doesn't have any spaces. "
          )}

          {!enterprisePlan && totalCost > 0 && (
            <span data-test-id="subscription-page.non-enterprise-price-information">
              The total for your spaces is{' '}
              <b>
                <Price value={totalCost} />
              </b>{' '}
              per month.{' '}
            </span>
          )}
          {enterprisePlan && data?.isCreateSpaceForSpacePlanEnabled ? (
            <StateLink
              component={TextLink}
              path=".space_create"
              trackingEvent={'space_creation:begin'}
              trackParams={{
                flow: 'space_creation',
              }}>
              Create Space
            </StateLink>
          ) : (
            <TextLink testId="subscription-page.create-space" onClick={onCreateSpace}>
              Create Space
            </TextLink>
          )}
        </Paragraph>
        {showExportBtn && (
          <Button
            testId="subscription-page.export-csv"
            className={styles.exportButton}
            disabled={isExportingCSV}
            loading={isExportingCSV}
            buttonType="muted"
            onClick={handleExportBtnClick}>
            Export
          </Button>
        )}
      </Flex>

      {numSpaces > 0 && (
        <>
          {!userCanManageSpaces && (
            <SpacePlansTable
              enterprisePlan={enterprisePlan}
              initialLoad={initialLoad || isLoading}
              onChangeSpace={onChangeSpace}
              onDeleteSpace={onDeleteSpace}
              organizationId={organizationId}
              plans={spacePlans}
              upgradedSpaceId={changedSpaceId}
            />
          )}

          {!isLoading && userCanManageSpaces && (
            <UsedAndUnusedSpacePlans
              initialLoad={initialLoad}
              usedSpacePlans={usedSpacePlans}
              unusedSpacePlans={unusedSpacePlans}
              organizationId={organizationId}
              changedSpaceId={changedSpaceId}
              onDeleteSpace={onDeleteSpace}
              onChangeSpace={onChangeSpace}
              enterprisePlan={enterprisePlan}
              isSpacePlanAssignmentExperimentEnabled={data?.isSpacePlanAssignmentExperimentEnabled}
              isCreateSpaceForSpacePlanEnabled={data?.isCreateSpaceForSpacePlanEnabled}
            />
          )}
        </>
      )}
    </>
  );
}
