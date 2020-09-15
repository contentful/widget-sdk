import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { css } from 'emotion';
import cn from 'classnames';

import {
  Paragraph,
  Heading,
  TextLink,
  Card,
  Tooltip,
  Icon,
  Note,
  Tabs,
  Tab,
  TabPanel,
} from '@contentful/forma-36-react-components';
import { getVariation, FLAGS } from 'LaunchDarkly';

import ExternalTextLink from 'app/common/ExternalTextLink';
import { websiteUrl } from 'Config';
import tokens from '@contentful/forma-36-tokens';
import { trackTargetedCTAClick, CTA_EVENTS } from 'analytics/trackCTA';
import TrackTargetedCTAImpression from 'app/common/TrackTargetedCTAImpression';

import { calculatePlansCost } from 'utils/SubscriptionUtils';
import { Pluralized, Price } from 'core/components/formatting';

import { UnassignedPlansTable } from './components/UnassignedPlansTable';
import { SpacePlansTable } from './components/SpacePlansTable';

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
};
const USED_SPACES = 'usedSpaces';
const UNUSED_SPACES = 'unusedSpaces';

function SpacePlans({
  initialLoad,
  spacePlans,
  upgradedSpaceId,
  onCreateSpace,
  onChangeSpace,
  onDeleteSpace,
  enterprisePlan,
  organizationId,
  showMicroSmallSupportCard,
  anySpacesInaccessible,
  isOrgOwner,
}) {
  const numSpaces = spacePlans.length;
  const totalCost = calculatePlansCost({ plans: spacePlans });

  const [showSpacePlanChangeBtn, setShowSpacePlanChangeBtn] = useState(false);
  const [unassignedSpacePlans, getUnassignedSpacePlans] = useState(null);
  const [assignedSpacePlans, getAssignedSpacePlans] = useState(null);
  const [selectedTab, setSelectedTab] = useState('usedSpaces');
  const [spacePlanTabsEnabled, setSpacePlanTabsEnabled] = useState(null);

  useEffect(() => {
    async function fetch() {
      const isFeatureEnabled = await getVariation(FLAGS.SPACE_PLAN_ASSIGNMENT);
      const unassignedSpacePlans = spacePlans.filter((plan) => plan.gatekeeperKey === null);
      const assignedSpacePlans = spacePlans.filter((plan) => plan.gatekeeperKey !== null);

      getUnassignedSpacePlans(unassignedSpacePlans);
      getAssignedSpacePlans(assignedSpacePlans);

      //  TODO: shouldShowSpacePlanChangeBtn and shouldShowSpaceTabs should be merged into one canManageSpacePlans which can be used for change link and tabs
      const shouldShowSpacePlanChangeBtn =
        isFeatureEnabled && enterprisePlan && isOrgOwner && unassignedSpacePlans.length > 0;
      const shouldShowSpaceTabs = isFeatureEnabled && enterprisePlan && isOrgOwner;

      setSpacePlanTabsEnabled(shouldShowSpaceTabs);
      setShowSpacePlanChangeBtn(shouldShowSpacePlanChangeBtn);
    }
    fetch();
  }, [setShowSpacePlanChangeBtn, enterprisePlan, isOrgOwner, spacePlans]);

  const linkToSupportPage = websiteUrl(
    `support/?utm_source=webapp&utm_medium=account-menu&utm_campaign=in-app-help&purchase-micro-or-small-space=${organizationId}`
  );

  const handleSupportRedirct = () => {
    trackTargetedCTAClick(CTA_EVENTS.PURCHASE_MICRO_SMALL_VIA_SUPPORT, {
      organizationId,
    });
  };

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

      {showMicroSmallSupportCard && (
        <Card className={styles.planChangingCard} testId="subscription-page.support-request-card">
          <Paragraph className={styles.cardTitle}>We&apos;re changing our plans</Paragraph>
          <Paragraph className={styles.total}>
            We recently updated the spaces available on our plans. For the remainder of 2020, you
            can continue to purchase new small and micro spaces by submitting a support request. To
            learn about the changes{' '}
            <ExternalTextLink
              testId="subscription-page.pricing-information-link"
              href={websiteUrl('pricing/')}>
              visit our website
            </ExternalTextLink>
            {'.'}
          </Paragraph>
          <TrackTargetedCTAImpression
            impressionType={CTA_EVENTS.PURCHASE_MICRO_SMALL_VIA_SUPPORT}
            meta={{ organizationId }}>
            <ExternalTextLink
              onClick={() => {
                handleSupportRedirct();
              }}
              testId="subscription-page.support-request-link"
              href={linkToSupportPage}>
              Submit a support request
            </ExternalTextLink>
          </TrackTargetedCTAImpression>
        </Card>
      )}

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
        <TextLink testId="subscription-page.create-space" onClick={onCreateSpace}>
          Create Space
        </TextLink>
      </Paragraph>
      {showSpacePlanChangeBtn && (
        <Note className={styles.note}>
          {`Click the "change" link next to the space type to change it.`}
        </Note>
      )}
      {(initialLoad || numSpaces > 0) &&
        (spacePlanTabsEnabled ? (
          <>
            <Tabs className={styles.tabs} withDivider>
              <Tab
                key={USED_SPACES}
                id={USED_SPACES}
                testId={`tab-${USED_SPACES}`}
                selected={selectedTab === USED_SPACES}
                onSelect={() => setSelectedTab(USED_SPACES)}>
                Used spaces
              </Tab>
              {unassignedSpacePlans.length > 0 && (
                <Tab
                  key={UNUSED_SPACES}
                  id={UNUSED_SPACES}
                  testId={`tab-${UNUSED_SPACES}`}
                  selected={selectedTab === UNUSED_SPACES}
                  onSelect={() => setSelectedTab(UNUSED_SPACES)}>
                  Unused spaces{' '}
                  {unassignedSpacePlans.length > 0 && `(${unassignedSpacePlans.length})`}
                </Tab>
              )}
            </Tabs>
            <TabPanel
              id={USED_SPACES}
              className={cn(styles.tabPanel, {
                [styles.isVisible]: selectedTab === USED_SPACES,
              })}>
              <SpacePlansTable
                plans={assignedSpacePlans}
                initialLoad={initialLoad}
                upgradedSpaceId={upgradedSpaceId}
                onChangeSpace={onChangeSpace}
                onDeleteSpace={onDeleteSpace}
                enterprisePlan={enterprisePlan}
                showSpacePlanChangeBtn={showSpacePlanChangeBtn}
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
                    showSpacePlanChangeBtn={showSpacePlanChangeBtn}
                  />
                )}
              </TabPanel>
            )}
          </>
        ) : (
          <SpacePlansTable
            plans={spacePlans}
            initialLoad={initialLoad}
            upgradedSpaceId={upgradedSpaceId}
            onChangeSpace={onChangeSpace}
            onDeleteSpace={onDeleteSpace}
            enterprisePlan={enterprisePlan}
            showSpacePlanChangeBtn={showSpacePlanChangeBtn}
          />
        ))}
    </>
  );
}

SpacePlans.propTypes = {
  initialLoad: PropTypes.bool,
  showMicroSmallSupportCard: PropTypes.bool,
  organizationId: PropTypes.string,
  spacePlans: PropTypes.array.isRequired,
  onCreateSpace: PropTypes.func.isRequired,
  onChangeSpace: PropTypes.func.isRequired,
  onDeleteSpace: PropTypes.func.isRequired,
  enterprisePlan: PropTypes.bool,
  upgradedSpaceId: PropTypes.string,
  anySpacesInaccessible: PropTypes.bool,
  isOrgOwner: PropTypes.bool,
};

SpacePlans.defaultProps = {
  initialLoad: true,
  enterprisePlan: false,
  upgradedSpaceId: '',
  anySpacesInaccessible: false,
};

export default SpacePlans;
