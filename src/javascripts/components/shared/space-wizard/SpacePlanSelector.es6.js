import React, { Fragment } from 'react';
import createReactClass from 'create-react-class';
import PropTypes from 'prop-types';
import {get} from 'lodash';
import {isOwner} from 'services/OrganizationRoles';
import {go} from 'states/Navigator';
import spinner from 'ui/Components/Spinner';
import {asReact} from 'ui/Framework/DOMRenderer';
import {resourceHumanNameMap} from 'utils/ResourceUtils';
import logger from 'logger';

import SpacePlanItem from './SpacePlanItem';
import BillingInfo from './BillingInfo';
import NoMorePlans from './NoMorePlans';

const SpacePlanSelector = createReactClass({
  propTypes: {
    organization: PropTypes.object.isRequired,
    space: PropTypes.object,
    limitReached: PropTypes.object,
    action: PropTypes.string.isRequired,
    track: PropTypes.func.isRequired,
    onSubmit: PropTypes.func.isRequired,
    onCancel: PropTypes.func.isRequired,
    reposition: PropTypes.func.isRequired,
    fetchSpacePlans: PropTypes.func.isRequired,
    selectPlan: PropTypes.func.isRequired,
    spacePlans: PropTypes.object.isRequired,
    selectedPlan: PropTypes.object
  },

  componentDidMount () {
    const { fetchSpacePlans, organization, space, reposition } = this.props;
    const spaceId = space && space.sys.id;

    fetchSpacePlans({ organization, spaceId }).then(reposition);
  },

  render () {
    const {organization, space, limitReached, action, spacePlans, selectedPlan} = this.props;
    const { spaceRatePlans, freeSpacesResource, isLoading } = spacePlans;

    const currentPlan = getCurrentPlan(spaceRatePlans);
    const highestPlan = getHighestPlan(spaceRatePlans);
    const recommendedPlan = limitReached && getRecommendedPlan(spaceRatePlans, limitReached);
    const atHighestPlan = highestPlan && highestPlan.unavailabilityReasons && highestPlan.unavailabilityReasons.find(reason => reason.type === 'currentPlan');
    const payingOrg = organization.isBillable;

    return <div>
      {
        isLoading &&
        <div className="loader__container">
          {asReact(spinner({diameter: '40px'}))}
        </div>
      }
      {
        !isLoading && spaceRatePlans &&
        <div>
          {!payingOrg &&
            <BillingInfo
              canSetupBilling={isOwner(organization)}
              goToBilling={this.goToBilling}
              action={action}
            />
          }
          { atHighestPlan &&
            <NoMorePlans canSetupBilling={isOwner(organization)} />
          }
          <h2 className="create-space-wizard__heading">
            Choose the space type
          </h2>
          { action === 'create' &&
            <Fragment>
              <p className="create-space-wizard__subheading">
                You are creating this space for the organization <em>{organization.name}</em>.<br/>
              </p>
              <div className="space-plans-list">
                {spaceRatePlans.map((plan) => <SpacePlanItem
                  key={plan.sys.id}
                  plan={plan}
                  freeSpacesResource={freeSpacesResource}
                  isPayingOrg={payingOrg}
                  isSelected={get(selectedPlan, 'sys.id') === plan.sys.id}
                  onSelect={this.selectPlan()} />)}
              </div>
            </Fragment>
          }
          { action === 'change' &&
            <Fragment>
              <p className="create-space-wizard__subheading">
                You are changing the space <em>{space.name}</em> for organization <em>{organization.name}</em>.<br/>
              </p>
              <div className="space-plans-list">
                {spaceRatePlans.map((plan) => <SpacePlanItem
                  key={plan.sys.id}
                  plan={plan}
                  freeSpacesResource={freeSpacesResource}
                  isCurrentPlan={currentPlan === plan}
                  isSelected={get(selectedPlan, 'sys.id') === plan.sys.id}
                  isRecommended={get(recommendedPlan, 'sys.id') === plan.sys.id}
                  isPayingOrg={payingOrg}
                  onSelect={this.selectPlan(currentPlan)} />)}
              </div>
            </Fragment>
          }
        </div>
      }
      {
        !isLoading && !spaceRatePlans &&
        <div className="note-box--warning">
          <p>Could not fetch space plans.</p>
        </div>
      }
    </div>;
  },

  selectPlan (currentPlan) {
    const { selectPlan, onSubmit } = this.props;

    return (selectedPlan) => {
      selectPlan(currentPlan, selectedPlan);
      onSubmit && onSubmit();
    };
  },
  goToBilling () {
    const {organization, track, onCancel} = this.props;
    const orgId = organization.sys.id;
    go({
      path: ['account', 'organizations', 'subscription_billing'],
      params: {orgId, pathSuffix: '/billing_address'},
      options: {reload: true}
    });
    track('link_click');
    onCancel();
  }
});

function getCurrentPlan (spaceRatePlans) {
  return spaceRatePlans.find(plan => {
    return plan.unavailabilityReasons &&
      plan.unavailabilityReasons.find(reason => reason.type === 'currentPlan');
  });
}

function getHighestPlan (spaceRatePlans) {
  return spaceRatePlans.slice().sort((planX, planY) => planY.price >= planX.price)[0];
}

function getRecommendedPlan (spaceRatePlans, {sys: {id}, usage}) {
  const resourceType = resourceHumanNameMap[id];
  if (!resourceType) {
    logger.logError(`Unknown resource type id: ${id}`);
  }

  function getResource ({includedResources}) {
    const resource = includedResources.find(({type}) => type === resourceType);
    return get(resource, 'number', 0);
  }

  return spaceRatePlans.slice()
    .sort((planX, planY) => getResource(planX) >= getResource(planY))
    .find((plan) => getResource(plan) > usage);
}

export default SpacePlanSelector;
