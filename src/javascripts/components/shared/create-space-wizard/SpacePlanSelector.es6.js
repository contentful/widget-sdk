import React from 'react';
import createReactClass from 'create-react-class';
import PropTypes from 'prop-types';
import classnames from 'classnames';
import FetchSpacePlans, {ResourceTypes} from './FetchSpacePlans';
import {get, kebabCase} from 'lodash';
import {isOwner} from 'services/OrganizationRoles';
import {go} from 'states/Navigator';
import HelpIcon from 'ui/Components/HelpIcon';
import Tooltip from 'ui/Components/Tooltip';
import spinner from 'ui/Components/Spinner';
import {asReact} from 'ui/Framework/DOMRenderer';
import {RequestState, formatPrice} from './WizardUtils';

const SpacePlanSelector = createReactClass({
  propTypes: {
    organization: PropTypes.object.isRequired,
    onChange: PropTypes.func.isRequired,
    onSubmit: PropTypes.func.isRequired,
    onDimensionsChange: PropTypes.func.isRequired,
    onCancel: PropTypes.func.isRequired
  },
  getInitialState () {
    return {selectedPlan: null};
  },
  render () {
    const {organization, onDimensionsChange} = this.props;
    const {selectedPlan} = this.state;

    return <FetchSpacePlans organization={organization} onUpdate={onDimensionsChange}>
      {({requestState, spaceRatePlans, freeSpacesResource}) => (
        <div>
          {requestState === RequestState.PENDING && <div className="loader__container">
            {asReact(spinner({diameter: '40px'}))}
          </div>}
          {requestState === RequestState.SUCCESS && <div>
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
          </div>}
          {requestState === RequestState.ERROR && <div className="note-box--warning">
            <p>Could not fetch space plans.</p>
          </div>}
        </div>
      )}
    </FetchSpacePlans>;
  },
  componentDidMount () {
    this.props.onDimensionsChange();
  },
  selectPlan (selectedPlan) {
    this.setState({selectedPlan});

    if (selectedPlan) {
      this.props.onChange({spaceRatePlan: selectedPlan});
      this.props.onSubmit();
    }
  },
  goToBilling () {
    const {organization, onCancel} = this.props;
    const orgId = organization.sys.id;
    go({
      path: ['account', 'organizations', 'subscription_billing'],
      params: {orgId, pathSuffix: '/billing_address'},
      options: {reload: true}
    });
    onCancel();
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
          {(plan.price > 0) && ` - ${formatPrice(plan.price)} / month`}
          {plan.isFree && ` - ${freeSpacesUsage}/${freeSpacesLimit} used`}
          {plan.isFree && <HelpIcon tooltipWidth={400}>
            You can create up to {freeSpacesLimit} free spaces for your organization.
            If you delete a free space, another one can be created.
          </HelpIcon>}
        </div>
        <ul className="space-plans-list__item__features">
          {plan.includedResources.map(({type, units}) => {
            const tooltip = getTooltip(type, units);
            return <li key={type}>
              {units + ' '}
              {tooltip && <Tooltip style={{display: 'inline'}} tooltip={tooltip}>
                <em className="x--underline">{type}</em>
              </Tooltip>}
              {!tooltip && type}
            </li>;
          })}
        </ul>
      </div>
    );
  }
});

const ResourceTooltips = {
  [ResourceTypes.Environments]: (units) => `This space type includes ${units} sandbox
      environments additional to the master environment, which allow you to create and
      maintain multiple versions of the space-specific data, and make changes to them
      in isolation.`,
  [ResourceTypes.Roles]: (units) => `This space type includes ${units} user roles
      additional to the admin role`,
  [ResourceTypes.Records]: () => 'Records are entries and assets combined.'
};

function getTooltip (type, units) {
  return ResourceTooltips[type] && ResourceTooltips[type](units);
}

const BillingInfo = createReactClass({
  propTypes: {
    canSetupBilling: PropTypes.bool.isRequired,
    goToBilling: PropTypes.func.isRequired
  },
  render: function () {
    const {canSetupBilling, goToBilling} = this.props;

    return (
      <div className="note-box--info">
        <p>
          You need to provide us with your billing address and credit card details before creating a paid space.
          {' '}
          {canSetupBilling && <React.Fragment>
            Head to the{' '}
            <button className="btn-link text-link" style={{display: 'inline'}} onClick={goToBilling}>
              organization settings
            </button>
            {' '}to add these details for the organization.
          </React.Fragment>}
          {!canSetupBilling && 'Please contact your organization’s owner.'}
        </p>
      </div>
    );
  }
});

export default SpacePlanSelector;
