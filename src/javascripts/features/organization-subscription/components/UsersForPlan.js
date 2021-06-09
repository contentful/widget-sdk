import React from 'react';
import PropTypes from 'prop-types';

import { Paragraph, TextLink, Heading } from '@contentful/forma-36-react-components';
import TrackTargetedCTAImpression from 'app/common/TrackTargetedCTAImpression';
import { Pluralized, Price } from 'core/components/formatting';
import { buildUrlWithUtmParams } from 'utils/utmBuilder';
import * as Config from 'Config';
import { useRouteNavigate, RouteLink } from 'core/react-routing';
import { trackTargetedCTAClick, CTA_EVENTS } from 'analytics/trackCTA';

const ENTERPRISE_FREE_USER_COUNT = 10;
const ENTERPRISE_ADDITIONAL_USER_COST = 15;

const withInAppHelpUtmParams = buildUrlWithUtmParams({
  source: 'webapp',
  medium: 'team_userlimit_request',
  campaign: 'in-app-help',
});

const AboveHardLimitWarning = ({ isFreePlan, hardLimit, organizationId }) => {
  const routeNavigate = useRouteNavigate();

  const onUpgradeToTeam = () => {
    trackTargetedCTAClick(CTA_EVENTS.UPGRADE_TO_TEAM, {
      organizationId: organizationId,
    });

    routeNavigate(
      { path: 'organizations.subscription_billing', orgId: organizationId },
      { reload: true }
    );
  };

  const onContactSupport = () => {
    trackTargetedCTAClick(CTA_EVENTS.REQUEST_TEAM_USER_LIMIT, {
      organizationId: organizationId,
    });
  };

  return (
    <>
      <Pluralized text="user" count={hardLimit} /> are included {isFreePlan ? 'free ' : null}with
      your subscription.{' '}
      <RouteLink
        route={{ path: 'organizations.users.list', orgId: organizationId }}
        options={{ reload: true }}
        as={TextLink}
        testId="subscription-page.org-memberships-link">
        Manage users
      </RouteLink>{' '}
      or{' '}
      {isFreePlan ? (
        <TrackTargetedCTAImpression
          impressionType={CTA_EVENTS.UPGRADE_TO_TEAM}
          meta={{ organizationId: organizationId }}>
          <TextLink onClick={onUpgradeToTeam} testId="subscription-page.upgrade-to-team-link">
            Upgrade to Team tier
          </TextLink>
        </TrackTargetedCTAImpression>
      ) : (
        <TrackTargetedCTAImpression
          impressionType={CTA_EVENTS.REQUEST_TEAM_USER_LIMIT}
          meta={{ organizationId: organizationId }}>
          <TextLink
            onClick={onContactSupport}
            testId="subscription-page.contact-support-link"
            href={withInAppHelpUtmParams(Config.supportUrl)}
            target="_blank"
            rel="noopener noreferrer">
            Contact support
          </TextLink>
        </TrackTargetedCTAImpression>
      )}
    </>
  );
};

AboveHardLimitWarning.propTypes = {
  organizationId: PropTypes.string.isRequired,
  hardLimit: PropTypes.number,
  isFreePlan: PropTypes.bool,
};

const EnterpriseTrialWarning = ({ numberFreeUsers }) => {
  return (
    numberFreeUsers > ENTERPRISE_FREE_USER_COUNT && (
      <>
        <Pluralized text="user" count={ENTERPRISE_FREE_USER_COUNT} /> are included free with
        Enterprise tier. Customers on the Enterprise tier can purchase additional users for{' '}
        <Price value={ENTERPRISE_ADDITIONAL_USER_COST} unit="month" /> per user.{' '}
      </>
    )
  );
};

EnterpriseTrialWarning.propTypes = {
  numberFreeUsers: PropTypes.number,
};

export function UsersForPlan({
  organizationId,
  numberFreeUsers,
  numberPaidUsers,
  costOfUsers,
  hardLimit,
  unitPrice,
  isFreePlan,
  isOnEnterpriseTrial,
}) {
  const totalOfUsers = numberFreeUsers + numberPaidUsers;
  const isAboveHardLimit = hardLimit && totalOfUsers > hardLimit;
  const isBetweenFreeAndHardLimit = !isAboveHardLimit && numberPaidUsers > 0;

  return (
    <div data-test-id="users-for-plan">
      <Heading className="section-title">Users</Heading>
      <Paragraph>
        Your organization has{' '}
        <b>
          <Pluralized text="user" count={totalOfUsers} />
        </b>
        .{' '}
        {isAboveHardLimit && (
          <AboveHardLimitWarning
            isFreePlan={isFreePlan}
            hardLimit={hardLimit}
            organizationId={organizationId}
          />
        )}
        {isBetweenFreeAndHardLimit && (
          <>
            <Pluralized text="user" count={numberFreeUsers} /> are included free with your
            subscription. You will be charged an additional <Price value={unitPrice} unit="month" />{' '}
            per user for <Pluralized text="user" count={numberPaidUsers} />. That is{' '}
            <strong>${costOfUsers}</strong> per month.{' '}
          </>
        )}
        {isOnEnterpriseTrial && <EnterpriseTrialWarning numberFreeUsers={numberFreeUsers} />}
        {!isAboveHardLimit && (
          <RouteLink
            route={{ path: 'organizations.users.list', orgId: organizationId }}
            options={{ reload: true }}
            as={TextLink}
            testId="subscription-page.org-memberships-link">
            Manage users
          </RouteLink>
        )}
      </Paragraph>
    </div>
  );
}

UsersForPlan.propTypes = {
  organizationId: PropTypes.string.isRequired,
  numberFreeUsers: PropTypes.number,
  numberPaidUsers: PropTypes.number,
  costOfUsers: PropTypes.number,
  hardLimit: PropTypes.number,
  unitPrice: PropTypes.number,
  isFreePlan: PropTypes.bool,
  isOnEnterpriseTrial: PropTypes.bool,
};

UsersForPlan.defaultProps = {
  numberFreeUsers: 0,
  numberPaidUsers: 0,
  costOfUsers: 0,
};
