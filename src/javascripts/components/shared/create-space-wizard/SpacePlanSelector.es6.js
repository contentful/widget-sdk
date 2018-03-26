import {createElement as h} from 'libs/react';
import createReactClass from 'create-react-class';
import PropTypes from 'libs/prop-types';
import {get} from 'lodash';
import {createOrganizationEndpoint} from 'data/EndpointFactory';
import {getSpaceRatePlans} from 'account/pricing/PricingDataProvider';
import {isOwner} from 'services/OrganizationRoles';
import {go} from 'states/Navigator';

export default createReactClass({
  propTypes: {
    organization: PropTypes.object.isRequired,
    submit: PropTypes.func.isRequired,
    onDimensionsChange: PropTypes.func
    cancel: PropTypes.func.isRequired
  },
  getInitialState: function () {
    return {
      spaceRatePlans: [],
      selectedPlan: null
    };
  },
  componentWillMount: async function () {
    const orgId = this.props.organization.sys.id;
    const endpoint = createOrganizationEndpoint(orgId);

    const spaceRatePlans = await getSpaceRatePlans(endpoint);
    this.setState({spaceRatePlans, selectedPlan: null});
    setTimeout(this.props.onDimensionsChange, 0);
  },
  render: function () {
    const {organization} = this.props;
    const {spaceRatePlans, selectedPlan} = this.state;

    return h('div', null,
      h('h2', {className: 'create-space-wizard-dialog__heading'}, 'Choose the space type'),
      h('p', {className: 'create-space-wizard-dialog__subheading'},
        `You are creating this space for organization ${organization.name}.`
      ),
      h('fieldset', {className: 'cfnext-form__fieldset'},
        spaceRatePlans.map((plan) => h('div', {
          key: plan.sys.id,
          className: 'cfnext-form-option'
        },
          h('input', {
            id: `space-rate-plan--${plan.sys.id}`,
            type: 'radio',
            name: 'productRatePlanId',
            value: plan.sys.id,
            checked: get(selectedPlan, 'sys.id') === plan.sys.id,
            onChange: this.selectPlan(plan)
          }),
          h('label', {
            htmlFor: `space-rate-plan--${plan.sys.id}`
          }, `${plan.name} ($${plan.price})`)
        ))
      ),
      billingInfo({organization, goToBilling: this.goToBilling})
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

function billingInfo ({organization, goToBilling}) {
  const hasSubscription = !!organization.isBillable;
  if (hasSubscription) {
    return '';
  } else {
    const canSetupBilling = isOwner(organization);
    const content = [
      'You need to provide us with your billing address and credit card details before creating a paid space. '
    ];
    if (canSetupBilling) {
      const billingLink = h('button', {
        className: 'btn-link',
        style: {display: 'inline'},
        onClick: goToBilling
      }, 'organization settings');
      content.push('Head to the ', billingLink, ' to add these details for the organization.');
    } else {
      content.push('Please contact your organization’s owner.');
    }
    return h('div', {className: 'note-box--info'}, h('p', null, ...content));
  }
}
