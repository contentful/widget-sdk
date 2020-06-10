import React from 'react';
import PropTypes from 'prop-types';
import { css } from 'emotion';
import { get } from 'lodash';
import { isOwner } from 'services/OrganizationRoles';
import { go } from 'states/Navigator';
import { getVariation } from 'LaunchDarkly';
import { COMMUNITY_PLAN_FLAG } from 'featureFlags';
import {
  SkeletonContainer,
  SkeletonBodyText,
  Card,
  Heading,
  Paragraph,
  Note,
} from '@contentful/forma-36-react-components';
import tokens from '@contentful/forma-36-tokens';

import { getStoreResources } from 'utils/ResourceUtils';
import { getRecommendedPlan } from './WizardUtils';
import SpacePlanItem from './SpacePlanItem';
import BillingInfo from './BillingInfo';
import NoMorePlans from './NoMorePlans';
import ExplainRecommendation from './ExplainRecommendation';

const styles = {
  marginBottom: css({
    marginBottom: tokens.spacingM,
  }),
  skeletonCard: css({
    marginBottom: tokens.spacingM,
    '&:last-child': {
      marginBottom: 0,
    },
  }),
  textCenter: css({
    textAlign: 'center',
  }),
};

class SpacePlanSelector extends React.Component {
  static propTypes = {
    organization: PropTypes.object.isRequired,
    space: PropTypes.object,
    action: PropTypes.string.isRequired,
    wizardScope: PropTypes.string.isRequired,
    track: PropTypes.func.isRequired,
    onSubmit: PropTypes.func.isRequired,
    onCancel: PropTypes.func.isRequired,
    reposition: PropTypes.func.isRequired,
    fetchSpacePlans: PropTypes.func.isRequired,
    getResourcesForSpace: PropTypes.func.isRequired,
    selectPlan: PropTypes.func.isRequired,
    spacePlans: PropTypes.object.isRequired,
    resources: PropTypes.object.isRequired,
    selectedPlan: PropTypes.object,
  };

  state = {
    isCommunityPlanEnabled: undefined,
  };

  async componentDidMount() {
    const {
      fetchSpacePlans,
      getResourcesForSpace,
      organization,
      space,
      action,
      wizardScope,
      reposition,
    } = this.props;
    const spaceId = space && space.sys.id;

    const isCommunityPlanEnabled = await getVariation(COMMUNITY_PLAN_FLAG, {
      organizationId: organization.sys.id,
      spaceId,
    });
    this.setState({ isCommunityPlanEnabled });

    await fetchSpacePlans({ organization, spaceId });
    reposition();

    if (action === 'change' && wizardScope === 'space') {
      getResourcesForSpace(spaceId);
    }
  }

  render() {
    const { isCommunityPlanEnabled } = this.state;
    const {
      organization,
      space,
      action,
      wizardScope,
      spacePlans,
      selectedPlan,
      resources: resourcesMeta,
    } = this.props;
    const { spaceRatePlans, freeSpacesResource, isPending } = spacePlans;

    const spaceId = space && space.sys.id;
    const resources = get(getStoreResources(resourcesMeta, spaceId), 'value');

    const isChangingInSpace = action === 'change' && wizardScope === 'space';

    const currentPlan = getCurrentPlan(spaceRatePlans);
    const highestPlan = getHighestPlan(spaceRatePlans);
    const recommendedPlan = isChangingInSpace && getRecommendedPlan(spaceRatePlans, resources);
    const atHighestPlan =
      highestPlan &&
      highestPlan.unavailabilityReasons &&
      highestPlan.unavailabilityReasons.find((reason) => reason.type === 'currentPlan');
    const payingOrg = organization.isBillable;

    return (
      <div>
        <Heading className={styles.textCenter}>Choose the space type</Heading>
        <br />

        {isPending && <LoadingState />}

        {!isPending && spaceRatePlans && (
          <>
            <Paragraph className={styles.textCenter}>
              {action === 'create' ? (
                <>You are creating this space for the organization {organization.name}.</>
              ) : (
                <>
                  You are changing the space {space.name} for organization {organization.name}.
                </>
              )}
            </Paragraph>
            <br />

            {atHighestPlan && (
              <div className={styles.marginBottom}>
                <NoMorePlans canSetupBilling={isOwner(organization)} />
              </div>
            )}

            {!payingOrg && (
              <div className={styles.marginBottom}>
                <BillingInfo
                  goToBilling={this.goToBilling}
                  canSetupBilling={isOwner(organization)}
                />
              </div>
            )}

            {payingOrg && recommendedPlan && (
              <ExplainRecommendation
                currentPlan={currentPlan}
                recommendedPlan={recommendedPlan}
                resources={resources}
              />
            )}

            {spaceRatePlans.map((plan) => (
              <SpacePlanItem
                key={plan.sys.id}
                plan={plan}
                freeSpacesResource={freeSpacesResource}
                isSelected={get(selectedPlan, 'sys.id') === plan.sys.id}
                isPayingOrg={payingOrg}
                onSelect={this.selectPlan(currentPlan, recommendedPlan)}
                isCommunityPlanEnabled={isCommunityPlanEnabled}
              />
            ))}
          </>
        )}

        {!isPending && !spaceRatePlans && (
          <Note noteType="negative">Could not fetch space plans.</Note>
        )}
      </div>
    );
  }

  selectPlan = (currentPlan, recommendedPlan) => {
    const { selectPlan, track, onSubmit } = this.props;

    return (selectedPlan) => {
      selectPlan(currentPlan, selectedPlan);
      track('select_plan', { currentPlan, selectedPlan, recommendedPlan });
      onSubmit && onSubmit();
    };
  };

  goToBilling = () => {
    const { organization, track, onCancel } = this.props;
    const orgId = organization.sys.id;
    go({
      path: ['account', 'organizations', 'subscription_billing'],
      params: { orgId, pathSuffix: '/billing_address' },
      options: { reload: true },
    });
    track('link_click');
    onCancel();
  };
}

function LoadingState() {
  return (
    <div>
      <SkeletonContainer svgHeight={32}>
        <SkeletonBodyText numberOfLines={1} />
      </SkeletonContainer>
      <Card className={styles.skeletonCard}>
        <SkeletonContainer svgHeight={48}>
          <SkeletonBodyText numberOfLines={2} />
        </SkeletonContainer>
      </Card>
      <Card className={styles.skeletonCard}>
        <SkeletonContainer svgHeight={48}>
          <SkeletonBodyText numberOfLines={2} />
        </SkeletonContainer>
      </Card>
      <Card className={styles.skeletonCard}>
        <SkeletonContainer svgHeight={48}>
          <SkeletonBodyText numberOfLines={2} />
        </SkeletonContainer>
      </Card>
    </div>
  );
}

function getCurrentPlan(spaceRatePlans) {
  return spaceRatePlans.find((plan) => {
    return (
      plan.unavailabilityReasons &&
      plan.unavailabilityReasons.find((reason) => reason.type === 'currentPlan')
    );
  });
}

function getHighestPlan(spaceRatePlans) {
  return [...spaceRatePlans].sort((planX, planY) => planY.price - planX.price)[0];
}

export default SpacePlanSelector;
