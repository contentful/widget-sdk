import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { css } from 'emotion';
import cn from 'classnames';
import { sortBy } from 'lodash';

import {
  Paragraph,
  Heading,
  TextLink,
  Tooltip,
  Icon,
  Note,
  Tabs,
  Tab,
  TabPanel,
  Button,
  Notification,
} from '@contentful/forma-36-react-components';
import { getVariation, FLAGS } from 'LaunchDarkly';
import StateLink from 'app/common/StateLink';

import { helpCenterUrl } from 'Config';
import tokens from '@contentful/forma-36-tokens';
import { track } from 'analytics/Analytics';
import { buildUrlWithUtmParams } from 'utils/utmBuilder';

import { calculatePlansCost } from 'utils/SubscriptionUtils';
import { Pluralized, Price } from 'core/components/formatting';

import { UnassignedPlansTable } from '../space-usage-summary/UnassignedPlansTable';
import { SpacePlansTable } from '../space-usage-summary/SpacePlansTable';

import { downloadSpacesUsage } from '../services/SpacesUsageService';

const styles = {
  total: css({
    marginBottom: '1.5em',
  }),
  planChangingCard: css({
    padding: '20px',
    marginBottom: '30px',
  }),
  cardTitle: css({
    marginBottom: '8px',
    fontWeight: 'bold',
    color: tokens.colorTextMid,
  }),
  inaccessibleHelpIcon: css({
    fill: tokens.colorElementDarkest,
    marginBottom: '-3px',
    marginLeft: tokens.spacingXs,
  }),
  note: css({
    marginBottom: tokens.spacingM,
  }),
  tabPanel: css({
    display: 'none',
    height: '100%',
  }),
  isVisible: css({
    display: 'block',
    padding: `${tokens.spacingM} 0 0 0`,
  }),
  exportButton: css({
    marginLeft: 'auto',
    float: 'right',
    marginBottom: tokens.spacingM,
  }),
};

const USED_SPACES = 'usedSpaces';
const UNUSED_SPACES = 'unusedSpaces';

const withUtmParams = buildUrlWithUtmParams({
  source: 'webapp',
  medium: 'subscription-space-table',
  campaign: 'in-app-help',
});

const trackHelpLink = () => track('space_usage_summary:help_link_clicked');

export function SpacePlans({
  initialLoad,
  spacePlans,
  upgradedSpaceId,
  onCreateSpace,
  onChangeSpace,
  onDeleteSpace,
  enterprisePlan,
  organizationId,
  anySpacesInaccessible,
  isOwnerOrAdmin,
}) {
  const numSpaces = spacePlans.length;
  const totalCost = calculatePlansCost({ plans: spacePlans });

  const [canManageSpaces, setCanManageSpaces] = useState(false);
  const [isSpaceAssignmentExperimentEnabled, setIsSpaceAssignmentExperimentEnabled] = useState(
    false
  );
  const [isSpaceCreateForSpacePlanEnabled, setIsSpaceCreateForSpacePlanEnabled] = useState(false);
  const [unassignedSpacePlans, setUnassignedSpacePlans] = useState(null);
  const [assignedSpacePlans, setAssignedSpacePlans] = useState(null);
  const [selectedTab, setSelectedTab] = useState('usedSpaces');
  const [isExportingCSV, setIsExportingCSV] = useState(false);

  useEffect(() => {
    async function fetch() {
      const isFeatureEnabled = await getVariation(FLAGS.SPACE_PLAN_ASSIGNMENT, { organizationId });
      const isSpaceCreateForSpacePlanEnabled = await getVariation(
        FLAGS.CREATE_SPACE_FOR_SPACE_PLAN
      );
      const isExperimentFeatureFlagEnabled = await getVariation(
        FLAGS.SPACE_PLAN_ASSIGNMENT_EXPERIMENT,
        { organizationId }
      );

      const unassignedSpacePlans = spacePlans.filter((plan) => plan.gatekeeperKey === null);
      const assignedSpacePlans = spacePlans.filter((plan) => plan.gatekeeperKey !== null);
      const sortedUnassignedPlans = sortBy(unassignedSpacePlans, 'price');

      setUnassignedSpacePlans(sortedUnassignedPlans);
      setAssignedSpacePlans(assignedSpacePlans);

      const canManageSpaces = isFeatureEnabled && enterprisePlan && isOwnerOrAdmin;
      setCanManageSpaces(canManageSpaces);
      setIsSpaceAssignmentExperimentEnabled(isExperimentFeatureFlagEnabled);
      setIsSpaceCreateForSpacePlanEnabled(isSpaceCreateForSpacePlanEnabled);
    }
    fetch();
  }, [setCanManageSpaces, enterprisePlan, isOwnerOrAdmin, spacePlans, organizationId]);

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

  const showExportBtn = !initialLoad && assignedSpacePlans?.length > 0;

  return (
    <>
      <Heading className="section-title">
        Spaces
        {anySpacesInaccessible && (
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

      <Paragraph className={styles.total} testId="subscription-page.organization-information">
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
        {enterprisePlan && isSpaceCreateForSpacePlanEnabled ? (
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

      {numSpaces > 0 && (
        <Note className={styles.note}>
          {'Check out your space usage in our new overview below! Got Questions? See '}
          <TextLink
            href={withUtmParams(`${helpCenterUrl}/subscription-plan/`)}
            onClick={trackHelpLink}
            target="_blank"
            rel="noopener noreferrer">
            this article
          </TextLink>
          {'.'}
        </Note>
      )}

      {(initialLoad || numSpaces > 0) &&
        (canManageSpaces ? (
          <>
            <Tabs className={styles.tabs} withDivider>
              {unassignedSpacePlans.length > 0 && (
                <>
                  <Tab
                    key={USED_SPACES}
                    id={USED_SPACES}
                    testId={`tab-${USED_SPACES}`}
                    selected={selectedTab === USED_SPACES}
                    onSelect={() => setSelectedTab(USED_SPACES)}>
                    Used spaces
                  </Tab>
                  <Tab
                    key={UNUSED_SPACES}
                    id={UNUSED_SPACES}
                    testId={`tab-${UNUSED_SPACES}`}
                    selected={selectedTab === UNUSED_SPACES}
                    onSelect={() => setSelectedTab(UNUSED_SPACES)}>
                    Unused spaces{' '}
                    {unassignedSpacePlans.length > 0 && `(${unassignedSpacePlans.length})`}
                  </Tab>
                </>
              )}
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
            </Tabs>
            <TabPanel
              id={USED_SPACES}
              className={cn(styles.tabPanel, {
                [styles.isVisible]: selectedTab === USED_SPACES,
              })}>
              <SpacePlansTable
                plans={assignedSpacePlans}
                organizationId={organizationId}
                initialLoad={initialLoad}
                upgradedSpaceId={upgradedSpaceId}
                onChangeSpace={onChangeSpace}
                onDeleteSpace={onDeleteSpace}
                enterprisePlan={enterprisePlan}
                showSpacePlanChangeBtn={canManageSpaces}
              />
            </TabPanel>
            {unassignedSpacePlans.length > 0 && (
              <TabPanel
                id={UNUSED_SPACES}
                className={cn(styles.tabPanel, {
                  [styles.isVisible]: selectedTab === UNUSED_SPACES,
                })}>
                {unassignedSpacePlans && (
                  <UnassignedPlansTable
                    plans={unassignedSpacePlans}
                    initialLoad={initialLoad}
                    showSpacePlanChangeBtn={canManageSpaces}
                    spaceAssignmentExperiment={isSpaceAssignmentExperimentEnabled}
                    canCreateSpaceWithPlan={isSpaceCreateForSpacePlanEnabled}
                  />
                )}
              </TabPanel>
            )}
          </>
        ) : (
          <>
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
            <SpacePlansTable
              plans={spacePlans}
              organizationId={organizationId}
              initialLoad={initialLoad}
              upgradedSpaceId={upgradedSpaceId}
              onChangeSpace={onChangeSpace}
              onDeleteSpace={onDeleteSpace}
              enterprisePlan={enterprisePlan}
              showSpacePlanChangeBtn={canManageSpaces}
            />
          </>
        ))}
    </>
  );
}

SpacePlans.propTypes = {
  initialLoad: PropTypes.bool,
  organizationId: PropTypes.string,
  spacePlans: PropTypes.array.isRequired,
  onCreateSpace: PropTypes.func.isRequired,
  onChangeSpace: PropTypes.func.isRequired,
  onDeleteSpace: PropTypes.func.isRequired,
  enterprisePlan: PropTypes.bool,
  upgradedSpaceId: PropTypes.string,
  anySpacesInaccessible: PropTypes.bool,
  isOwnerOrAdmin: PropTypes.bool,
};

SpacePlans.defaultProps = {
  initialLoad: true,
  enterprisePlan: false,
  upgradedSpaceId: '',
  anySpacesInaccessible: false,
};
