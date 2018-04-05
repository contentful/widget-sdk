import React from 'libs/react';
import createReactClass from 'create-react-class';
import PropTypes from 'libs/prop-types';
import classnames from 'classnames';
import FetchSpacePlans from './FetchSpacePlans';
import {get, kebabCase} from 'lodash';
import {isOwner} from 'services/OrganizationRoles';
import {go} from 'states/Navigator';
import HelpIcon from 'ui/Components/HelpIcon';
import spinner from 'ui/Components/Spinner';
import {asReact} from 'ui/Framework/DOMRenderer';

const SpacePlanSelector = createReactClass({
  propTypes: {
    organization: PropTypes.object.isRequired,
    submit: PropTypes.func.isRequired,
    onDimensionsChange: PropTypes.func,
    cancel: PropTypes.func.isRequired
  },
  getInitialState () {
    return {selectedPlan: null};
  },
  render () {
    const {organization, onDimensionsChange} = this.props;
    const {selectedPlan} = this.state;

    return <FetchSpacePlans
      organization={organization}
      renderProgress={() => <div className="loader__container">
        {asReact(spinner({diameter: '40px'}))}
      </div>}
      renderData={({spaceRatePlans, freeSpacesResource}) => {
        setTimeout(onDimensionsChange, 0); // reposition dialog after dom is updated

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
                freeSpacesResource={freeSpacesResource}
                isSelected={get(selectedPlan, 'sys.id') === plan.sys.id}
                onSelect={this.selectPlan} />)}
            </div>
            {!organization.isBillable && <BillingInfo
              canSetupBilling={isOwner(organization)}
              goToBilling={this.goToBilling} />}
          </div>
        );
      }}
    />;
  },
  selectPlan (selectedPlan) {
    this.setState({selectedPlan});

    if (selectedPlan) {
      this.props.submit({spaceRatePlan: selectedPlan});
    }
  },
  goToBilling () {
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
    freeSpacesResource: PropTypes.object.isRequired,
    onSelect: PropTypes.func.isRequired
  },
  render: function () {
    const {plan, isSelected, freeSpacesResource, onSelect} = this.props;
    const freeSpacesUsage = freeSpacesResource.usage;
    const freeSpacesLimit = freeSpacesResource.limits.maximum;

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
    canSetupBilling: PropTypes.bool.isRequired,
    goToBilling: PropTypes.func.isRequired
  },
  render: function () {
    const {canSetupBilling, goToBilling} = this.props;

    const content = [
      'You need to provide us with your billing address and credit card details before creating a paid space. '
    ];

    if (canSetupBilling) {
      const billingLink = (
        <button className="btn-link" style={{display: 'inline'}} onClick={goToBilling}>
          organization settings
        </button>
      );
      content.push('Head to the ', billingLink, ' to add these details for the organization.');
    } else {
      content.push('Please contact your organization’s owner.');
    }

    return <div className="note-box--info"><p>{content}</p></div>;
  }
});

export default SpacePlanSelector;
