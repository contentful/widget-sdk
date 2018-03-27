import {createElement as h} from 'libs/react';
import createReactClass from 'create-react-class';
import PropTypes from 'libs/prop-types';
import {get} from 'lodash';
import {createOrganizationEndpoint} from 'data/EndpointFactory';
import {getSpaceRatePlans} from 'account/pricing/PricingDataProvider';

export default createReactClass({
  propTypes: {
    organization: PropTypes.object.isRequired,
    submit: PropTypes.func.isRequired
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
      )
    );
  },
  selectPlan: function (selectedPlan) {
    return () => {
      this.setState({...this.state, selectedPlan});

      if (selectedPlan) {
        this.props.submit({spaceRatePlan: selectedPlan});
      }
    };
  }
});
