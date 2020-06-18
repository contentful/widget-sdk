import React from 'react';
import PropTypes from 'prop-types';
import { css } from 'emotion';
import { get } from 'lodash';
import { isOwner } from 'services/OrganizationRoles';
import { Typography, Heading, Paragraph } from '@contentful/forma-36-react-components';
import tokens from '@contentful/forma-36-tokens';
import {
  Organization as OrganizationPropType,
  Space as SpacePropType,
} from 'app/OrganizationSettings/PropTypes';
import ExternalTextLink from 'app/common/ExternalTextLink';
import { websiteUrl } from 'Config';

import SpacePlanItem from './SpacePlanItem';
import BillingInfo from './BillingInfo';
import NoMorePlans from './NoMorePlans';
import ExplainRecommendation from './ExplainRecommendation';

import { getHighestPlan, getRecommendedPlan } from '../shared/utils';

const styles = {
  textCenter: css({
    textAlign: 'center',
  }),
  marginBottom: css({
    marginBottom: tokens.spacingM,
  }),
  container: css({
    margin: `0 ${tokens.spacingXl}`,
  }),
};

export default function SpacePlanSelector(props) {
  const {
    organization,
    space,
    spaceRatePlans,
    freeSpacesResource,
    selectedPlan,
    currentPlan,
    spaceResources,
    goToBillingPage,
    onSelectPlan,
    isCommunityPlanEnabled,
    isPayingPreviousToV2,
    isChanging = false,
  } = props;

  const highestPlan = getHighestPlan(spaceRatePlans);

  const atHighestPlan =
    highestPlan &&
    highestPlan.unavailabilityReasons &&
    highestPlan.unavailabilityReasons.some(({ type }) => type === 'currentPlan');
  const payingOrg = !!organization.isBillable;
  const recommendedPlan =
    isChanging && getRecommendedPlan(currentPlan, spaceRatePlans, spaceResources);

  return (
    <div data-test-id="space-plan-selector" className={styles.container}>
      <Typography>
        <Heading className={styles.textCenter}>Choose the space type</Heading>

        <Paragraph className={styles.textCenter}>
          You are {isChanging ? `changing the space ${space.name}` : `creating this space`} for the
          organization {organization.name}.
        </Paragraph>

        {isCommunityPlanEnabled && isPayingPreviousToV2 && (
          <>
            <Paragraph className={styles.textCenter}>
              <b>Where are the Micro and Small spaces?</b>{' '}
              {isChanging ? (
                <>
                  We have made some changes to our space plans.
                  <br />
                  To learn about the new features you have access to{' '}
                </>
              ) : (
                <>
                  You can continue to buy micro or small spaces by{' '}
                  <ExternalTextLink
                    href={websiteUrl(
                      'support/?utm_source=webapp&utm_medium=account-menu&utm_campaign=in-app-help'
                    )}>
                    submitting a support request.
                  </ExternalTextLink>{' '}
                  To learn about our space plan changes
                </>
              )}{' '}
              <ExternalTextLink href={websiteUrl('pricing/')}>visit our website.</ExternalTextLink>
            </Paragraph>
          </>
        )}

        {atHighestPlan && (
          <div className={styles.marginBottom}>
            <NoMorePlans canSetupBilling={isOwner(organization)} />
          </div>
        )}

        {!payingOrg && (
          <div className={styles.marginBottom}>
            <BillingInfo goToBilling={goToBillingPage} canSetupBilling={isOwner(organization)} />
          </div>
        )}

        {payingOrg && recommendedPlan && (
          <div className={styles.marginBottom}>
            <ExplainRecommendation
              currentPlan={currentPlan}
              recommendedPlan={recommendedPlan}
              resources={spaceResources}
            />
          </div>
        )}

        {spaceRatePlans.map((plan) => (
          <SpacePlanItem
            key={plan.sys.id}
            plan={plan}
            freeSpacesResource={freeSpacesResource}
            isPayingOrg={payingOrg}
            isSelected={get(selectedPlan, 'sys.id') === plan.sys.id}
            isRecommended={get(recommendedPlan, 'sys.id') === plan.sys.id}
            onSelect={onSelectPlan}
            isCommunityPlanEnabled={isCommunityPlanEnabled}
          />
        ))}
      </Typography>
    </div>
  );
}

SpacePlanSelector.propTypes = {
  organization: OrganizationPropType.isRequired,
  space: SpacePropType,
  spaceRatePlans: PropTypes.array.isRequired,
  freeSpacesResource: PropTypes.object,
  onSelectPlan: PropTypes.func.isRequired,
  currentPlan: PropTypes.object,
  selectedPlan: PropTypes.object,
  spaceResources: PropTypes.array,
  goToBillingPage: PropTypes.func.isRequired,
  isCommunityPlanEnabled: PropTypes.bool,
  isPayingPreviousToV2: PropTypes.bool,
  isChanging: PropTypes.bool,
};