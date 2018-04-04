import React from 'libs/react';
import createReactClass from 'create-react-class';
import PropTypes from 'libs/prop-types';
import {get} from 'lodash';
import {createOrganizationEndpoint} from 'data/EndpointFactory';
import {getSpaceRatePlans} from 'account/pricing/PricingDataProvider';
import createResourceService from 'services/ResourceService';
import {isOwner} from 'services/OrganizationRoles';
import {go} from 'states/Navigator';
import HelpIcon from 'ui/Components/HelpIcon';

const SpacePlanSelector = createReactClass({
  propTypes: {
    organization: PropTypes.object.isRequired,
    submit: PropTypes.func.isRequired,
    onDimensionsChange: PropTypes.func,
    cancel: PropTypes.func.isRequired
  },
  getInitialState: function () {
    return {
      spaceRatePlans: [],
      selectedPlan: null
    };
  },
  componentWillMount: async function () {
    const {organization} = this.props;

    const spaceRatePlans = await getFormattedSpacePlans(organization);

    const resourceService = createResourceService(organization.sys.id, 'organization');
    const freeSpacesResource = await resourceService.get('free_space');

    this.setState({
      spaceRatePlans,
      selectedPlan: null,
      freeSpacesLimit: get(freeSpacesResource, 'limits.maximum')
    });
    setTimeout(this.props.onDimensionsChange, 0);
  },
  render: function () {
    const {organization} = this.props;
    const {spaceRatePlans, selectedPlan, freeSpacesLimit} = this.state;

    return (
      <div>
        <h2 className="create-space-wizard-dialog__heading">
          Choose the space type
        </h2>
        <p className="create-space-wizard-dialog__subheading">
          You are creating this space for organization {organization.name}.
        </p>
        <fieldset className="cfnext-form__fieldset">
          {spaceRatePlans.map((plan) => <SpacePlanItem
            key={plan.sys.id}
            plan={plan}
            freeSpacesLimit={freeSpacesLimit}
            isSelected={get(selectedPlan, 'sys.id') === plan.sys.id}
            onSelect={this.selectPlan(plan)} />)}
        </fieldset>
        <BillingInfo organization={organization} goToBilling={this.goToBilling} />
      </div>
    );
  },
  selectPlan: function (selectedPlan) {
    return () => {
      this.setState({...this.state, selectedPlan});

      if (selectedPlan) {
        this.props.submit({spaceRatePlan: selectedPlan});
      }
    };
  },
  goToBilling: function () {
    const {organization, cancel} = this.props;
    const orgId = organization.sys.id;
    go({
      path: ['account', 'organizations', 'subscription_billing'],
      params: {orgId, pathSuffix: '/billing_address'},
      options: {reload: true}
    });
    cancel();
  }
});

const SpacePlanItem = createReactClass({
  propTypes: {
    plan: PropTypes.object.isRequired,
    isSelected: PropTypes.bool.isRequired,
    freeSpacesLimit: PropTypes.number.isRequired,
    onSelect: PropTypes.func.isRequired
  },
  render: function () {
    const {plan, isSelected, freeSpacesLimit, onSelect} = this.props;

    return (
      <div key={plan.sys.id} className="cfnext-form-option">
        <input
          id={`space-rate-plan--${plan.sys.id}`}
          type="radio"
          name="productRatePlanId"
          value={plan.sys.id}
          checked={isSelected}
          disabled={plan.disabled}
          onChange={onSelect} />
        <label
          htmlFor={`space-rate-plan--${plan.sys.id}`}
          style={plan.disabled ? {textDecoration: 'line-through'} : null}>
          {`${plan.name} ($${plan.price})`}
          {(plan.isFree && plan.disabled) && <HelpIcon tooltipWidth={400}>
            {`You can create up to ${freeSpacesLimit} free spaces for your organization.
             If you delete a free space, another one can be created.`}
          </HelpIcon>}
        </label>
      </div>
    );
  }
});

const BillingInfo = createReactClass({
  propTypes: {
    organization: PropTypes.object.isRequired,
    goToBilling: PropTypes.func.isRequired
  },
  render: function () {
    const {organization, goToBilling} = this.props;
    const hasSubscription = !!organization.isBillable;

    if (hasSubscription) {
      return '';
    } else {
      const canSetupBilling = isOwner(organization);
      const content = [
        'You need to provide us with your billing address and credit card details before creating a paid space. '
      ];

      if (canSetupBilling) {
        const billingLink = (
          <button
            className="btn-link"
            style={{display: 'inline'}}
            onClick={goToBilling}>
            organization settings
          </button>
        );
        content.push('Head to the ', billingLink, ' to add these details for the organization.');
      } else {
        content.push('Please contact your organization’s owner.');
      }

      return <div className="note-box--info"><p>{content}</p></div>;
    }
  }
});

async function getFormattedSpacePlans (organization) {
  const endpoint = createOrganizationEndpoint(organization.sys.id);
  let spaceRatePlans = await getSpaceRatePlans(endpoint);

  spaceRatePlans = spaceRatePlans.map((plan) => {
    const isFree = (plan.productPlanType === 'free_space');
    return {
      ...plan,
      isFree,
      disabled: !isFree && !organization.isBillable
    };
  });

  // If free space plan is not available, show it as disabled
  if (!spaceRatePlans.find(({isFree}) => isFree)) {
    spaceRatePlans = [{
      sys: {id: 'free'},
      name: 'Free',
      price: 0,
      isFree: true,
      disabled: true
    }, ...spaceRatePlans];
  }

  return spaceRatePlans;
}

export default SpacePlanSelector;
