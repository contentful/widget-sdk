import {createElement as h} from 'libs/react';
import createReactClass from 'create-react-class';
import PropTypes from 'libs/prop-types';
import {get} from 'lodash';
import {createOrganizationEndpoint} from 'data/EndpointFactory';
import {getSpaceRatePlans} from 'account/pricing/PricingDataProvider';

const Step1 = createReactClass({
  propTypes: {
    orgId: PropTypes.string.isRequired,
    submit: PropTypes.func.isRequired
  },
  getInitialState: function () {
    return {
      spaceRatePlans: [],
      selectedPlan: null
    };
  },
  componentWillMount: async function () {
    const {orgId} = this.props;
    const endpoint = createOrganizationEndpoint(orgId);

    const spaceRatePlans = await getSpaceRatePlans(endpoint);
    this.setState({spaceRatePlans, selectedPlan: null});
  },
  render: function () {
    const {spaceRatePlans} = this.state;

    return h('div', null,
      h('fieldset', {className: 'cfnext-form__fieldset'},
        spaceRatePlans.map((plan) => h('div', {
          key: plan.sys.id,
          className: 'cfnext-form-option'
        },
          h('input', {
            id: `space-rate-plan--${plan.sys.id}`,
            type: 'radio',
            name: 'space-rate-plan',
            value: plan.sys.id,
            checked: get(this.state.selectedPlan, 'sys.id') === plan.sys.id,
            onChange: () => this.selectPlan(plan)
          }),
          h('label', {htmlFor: `space-rate-plan--${plan.sys.id}`}, plan.name)
        ))
      ),
      h('button', {
        className: 'button btn-action',
        onClick: this.submit
      }, 'SELECT PLAN')
    );
  },
  selectPlan: function (plan) {
    const {spaceRatePlans} = this.state;
    this.setState({spaceRatePlans, selectedPlan: plan});
  },
  submit: function () {
    const {submit} = this.props;
    const {selectedPlan} = this.state;
    submit({spacePlan: selectedPlan});
  }
});

export default Step1;
