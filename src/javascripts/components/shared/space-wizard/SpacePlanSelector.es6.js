import React, { Fragment } from 'react';
import createReactClass from 'create-react-class';
import PropTypes from 'prop-types';
import classnames from 'classnames';
import FetchSpacePlans, {ResourceTypes} from './FetchSpacePlans';
import {get, kebabCase, template} from 'lodash';
import {isOwner} from 'services/OrganizationRoles';
import {go} from 'states/Navigator';
import HelpIcon from 'ui/Components/HelpIcon';
import Tooltip from 'ui/Components/Tooltip';
import spinner from 'ui/Components/Spinner';
import {TextLink} from '@contentful/ui-component-library';
import {asReact} from 'ui/Framework/DOMRenderer';
import Icon from 'ui/Components/Icon';
import ContactUsButton from 'ui/Components/ContactUsButton';
import {RequestState, formatPrice} from './WizardUtils';
import pluralize from 'pluralize';

const SpacePlanSelector = createReactClass({
  propTypes: {
    organization: PropTypes.object.isRequired,
    space: PropTypes.object,
    action: PropTypes.string.isRequired,
    onChange: PropTypes.func.isRequired,
    onSubmit: PropTypes.func.isRequired,
    onDimensionsChange: PropTypes.func.isRequired,
    onCancel: PropTypes.func.isRequired
  },
  getInitialState () {
    return {newSpaceRatePlan: null};
  },
  render () {
    const {organization, space, action, onDimensionsChange} = this.props;
    const {newSpaceRatePlan} = this.state;

    return (
      <FetchSpacePlans
        organization={organization}
        action={action}
        spaceId={space && space.sys.id}
        onUpdate={onDimensionsChange}
      >
        {({requestState, spaceRatePlans, freeSpacesResource}) => {
          const currentPlan = spaceRatePlans.find(plan => {
            return plan.unavailabilityReasons && plan.unavailabilityReasons.find(reason => reason.type === 'currentPlan');
          });
          const highestPlan = spaceRatePlans.slice().sort((planX, planY) => planY.price >= planX.price)[0];
          const atHighestPlan = highestPlan && highestPlan.unavailabilityReasons && highestPlan.unavailabilityReasons.find(reason => reason.type === 'currentPlan');

          return <div>
            {requestState === RequestState.PENDING && <div className="loader__container">
              {asReact(spinner({diameter: '40px'}))}
            </div>}
            {requestState === RequestState.SUCCESS && <div>
              {!organization.isBillable &&
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
                      isSelected={get(newSpaceRatePlan, 'sys.id') === plan.sys.id}
                      onSelect={this.selectPlan()} />)}
                  </div>
                </Fragment>
              }
              { action === 'change' &&
                <Fragment>
                  <p className="create-space-wizard__subheading">
                    You are upgrading the space <em>{space.name}</em> for organization <em>{organization.name}</em>.<br/>
                  </p>
                  <div className="space-plans-list">
                    {spaceRatePlans.map((plan) => <SpacePlanItem
                      key={plan.sys.id}
                      plan={plan}
                      freeSpacesResource={freeSpacesResource}
                      isCurrentPlan={currentPlan === plan}
                      isSelected={get(newSpaceRatePlan, 'sys.id') === plan.sys.id}
                      onSelect={this.selectPlan(currentPlan)} />)}
                  </div>
                </Fragment>
              }
            </div>}
            {requestState === RequestState.ERROR && <div className="note-box--warning">
              <p>Could not fetch space plans.</p>
            </div>}
          </div>;
        }}
      </FetchSpacePlans>
    );
  },
  selectPlan (currentPlan) {
    return (selectedPlan) => {
      this.setState({
        newSpaceRatePlan: selectedPlan,
        currentSpaceRatePlan: currentPlan
      });

      if (selectedPlan) {
        this.props.onChange({
          newSpaceRatePlan: selectedPlan,
          currentSpaceRatePlan: currentPlan
        });
        this.props.onSubmit();
      }
    };
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
    freeSpacesResource: PropTypes.object,
    onSelect: PropTypes.func.isRequired,
    isCurrentPlan: PropTypes.bool
  },
  render: function () {
    const {plan, isCurrentPlan, isSelected, freeSpacesResource, onSelect} = this.props;
    const freeSpacesUsage = freeSpacesResource && freeSpacesResource.usage;
    const freeSpacesLimit = freeSpacesResource && freeSpacesResource.limits.maximum;

    return (
      <div
        key={plan.sys.id}
        className={classnames(
          'space-plans-list__item',
          `space-plans-list__item--${kebabCase(plan.name)}`,
          {
            'space-plans-list__item--selected': isSelected,
            'space-plans-list__item--disabled': plan.disabled,
            'space-plans-list__item--current': isCurrentPlan
          }
        )}
        onClick={() => !plan.disabled && onSelect(plan)}>

        <div className="space-plans-list__item__heading">
          <strong data-test-id="space-plan-name">{plan.name}</strong>
          {(plan.price > 0) && <React.Fragment>
            {' - '}
            <span data-test-id="space-plan-price">{formatPrice(plan.price)}</span>
            {' / month'}
          </React.Fragment>}
          {plan.isFree && ` - ${freeSpacesUsage}/${freeSpacesLimit} used`}
          {plan.isFree && <HelpIcon tooltipWidth={400}>
            You can have up to {freeSpacesLimit} free spaces for your organization.
            If you delete a free space, another one can be created.
          </HelpIcon>}
        </div>
        <ul className="space-plans-list__item__features">
          {plan.includedResources.map(({type, number}) => {
            const tooltip = getTooltip(type, number);
            return <li key={type}>
              {number + ' '}
              {tooltip && <Tooltip style={{display: 'inline'}} tooltip={tooltip}>
                <em className="x--underline">{pluralize(type, number)}</em>
              </Tooltip>}
              {!tooltip && pluralize(type, number)}
            </li>;
          })}
        </ul>
        <Icon className="space-plans-list__item__chevron" name="dd-arrow-down"/>
      </div>
    );
  }
});

const ResourceTooltips = {
  [ResourceTypes.Environments]: `This space type includes <%= number %>
      <%= units %> additional to the master environment, which allow you to create and
      maintain multiple versions of the space-specific data, and make changes to them
      in isolation.`,
  [ResourceTypes.Roles]: `This space type includes <%= number %> <%= units %>
      additional to the admin role`,
  [ResourceTypes.Records]: 'Records are entries and assets combined.'
};
const ResourceUnitNames = {
  [ResourceTypes.Environments]: 'sandbox environment',
  [ResourceTypes.Roles]: 'user role'
};

function getTooltip (type, number) {
  const unitName = ResourceUnitNames[type];
  const units = unitName && pluralize(unitName, number);
  return ResourceTooltips[type] && template(ResourceTooltips[type])({number, units});
}

const BillingInfo = createReactClass({
  propTypes: {
    canSetupBilling: PropTypes.bool.isRequired,
    goToBilling: PropTypes.func.isRequired,
    action: PropTypes.string.isRequired
  },
  render: function () {
    const { canSetupBilling, goToBilling, action } = this.props;

    return (
      <div className="note-box--info create-space-wizard__info">
        {canSetupBilling && <p>
          <span><TextLink onClick={goToBilling}>Add payment details</TextLink> for the organization&#32;</span>
          { action === 'create' &&
            'before creating a paid space.'
          }
          { action === 'change' &&
            'before changing a space.'
          }
        </p>}
        {!canSetupBilling && <p>
          <span>The owner of this organization needs to add payment details before you can&#32;</span>
          { action === 'create' &&
            'create a paid space.'
          }
          { action === 'change' &&
            'change a space.'
          }
        </p>}
      </div>
    );
  }
});

const NoMorePlans = ({ canSetupBilling }) => {
  return <div className='note-box--info create-space-wizard__info'>
    <p>
      <span>You&apos;re using the largest space available.</span>
      { canSetupBilling &&
        <span>&#32;<ContactUsButton noIcon /> if you need higher limits.</span>
      }
    </p>
  </div>;
};

NoMorePlans.propTypes = {
  canSetupBilling: PropTypes.bool.isRequired
};

export default SpacePlanSelector;
