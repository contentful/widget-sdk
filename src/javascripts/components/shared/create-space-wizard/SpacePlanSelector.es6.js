import React from 'libs/react';
import createReactClass from 'create-react-class';
import PropTypes from 'libs/prop-types';
import classnames from 'classnames';
import {get, kebabCase, isNumber} from 'lodash';
import {createOrganizationEndpoint} from 'data/EndpointFactory';
import {getSpaceRatePlans} from 'account/pricing/PricingDataProvider';
import createResourceService from 'services/ResourceService';
import {canCreate} from 'utils/ResourceUtils';
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

    const resourceService = createResourceService(organization.sys.id, 'organization');
    const freeSpacesResource = await resourceService.get('free_space');

    const spaceRatePlans = await getFormattedSpacePlans(organization, freeSpacesResource);

    this.setState({
      spaceRatePlans,
      selectedPlan: null,
      freeSpacesLimit: get(freeSpacesResource, 'limits.maximum'),
      freeSpacesUsage: get(freeSpacesResource, 'usage')
    });
    setTimeout(this.props.onDimensionsChange, 0);
  },
  render: function () {
    const {organization} = this.props;
    const {spaceRatePlans, selectedPlan, freeSpacesLimit, freeSpacesUsage} = this.state;

    return (
      <div>
        <h2 className="create-space-wizard__heading">
          Choose the space type
        </h2>
        <p className="create-space-wizard__subheading">
          You are creating this space for organization {organization.name}.
        </p>
        <div className="space-plans-list">
          {spaceRatePlans.map((plan) => <SpacePlanItem
            key={plan.sys.id}
            plan={plan}
            freeSpacesLimit={freeSpacesLimit}
            freeSpacesUsage={freeSpacesUsage}
            isSelected={get(selectedPlan, 'sys.id') === plan.sys.id}
            onSelect={this.selectPlan} />)}
        </div>
        <BillingInfo organization={organization} goToBilling={this.goToBilling} />
      </div>
    );
  },
  selectPlan: function (selectedPlan) {
    this.setState({selectedPlan});

    if (selectedPlan) {
      this.props.submit({spaceRatePlan: selectedPlan});
    }
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
    freeSpacesUsage: PropTypes.number.isRequired,
    onSelect: PropTypes.func.isRequired
  },
  render: function () {
    const {plan, isSelected, freeSpacesLimit, freeSpacesUsage, onSelect} = this.props;

    return (
      <div
        key={plan.sys.id}
        className={classnames(
          'space-plans-list__item',
          `space-plans-list__item--${kebabCase(plan.name)}`,
          {
            'space-plans-list__item--selected': isSelected,
            'space-plans-list__item--disabled': plan.disabled
          }
        )}
        onClick={() => !plan.disabled && onSelect(plan)}>

        <div className="space-plans-list__item__heading">
          <strong>{plan.name}</strong>
          {(plan.price > 0) && ` - $${plan.price} / month`}
          {plan.isFree && ` - ${freeSpacesUsage}/${freeSpacesLimit} used`}
          {plan.isFree && <HelpIcon tooltipWidth={400}>
            You can create up to {freeSpacesLimit} free spaces for your organization.
            If you delete a free space, another one can be created.
          </HelpIcon>}
        </div>
        <ul className="space-plans-list__item__features">
          {plan.includedResources.map(({name, units}) => <li key={name}>
            {units} {name}
          </li>)}
        </ul>
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

const RESOURCE_ORDER = ['Environments', 'Roles', 'Locales', 'Content types', 'Records'];

async function getFormattedSpacePlans (organization, freeSpacesResource) {
  const endpoint = createOrganizationEndpoint(organization.sys.id);
  const spaceRatePlans = await getSpaceRatePlans(endpoint);

  return spaceRatePlans.map((plan) => {
    const isFree = (plan.productPlanType === 'free_space');
    const includedResources = plan.productRatePlanCharges
      .filter(({unitType, tiers}) => unitType === 'limit' && isNumber(get(tiers, '[0].endingUnit')))
      .map((limit) => ({name: limit.name, units: limit.tiers[0].endingUnit}))
      .sort((first, second) => RESOURCE_ORDER.indexOf(first.name) > RESOURCE_ORDER.indexOf(second.name));

    return {
      ...plan,
      isFree,
      includedResources,
      disabled: isFree ? !canCreate(freeSpacesResource) : !organization.isBillable
    };
  });
}

export default SpacePlanSelector;
