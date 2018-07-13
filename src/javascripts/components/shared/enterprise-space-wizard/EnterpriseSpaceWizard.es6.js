import React from 'react';
import PropTypes from 'prop-types';
import { getIncludedResources, getTooltip } from 'components/shared/space-wizard/WizardUtils';
import pluralize from 'pluralize';
import { toLocaleString } from 'utils/NumberUtils';

import Tooltip from 'ui/Components/Tooltip';
import Dialog from 'app/entity_editor/Components/Dialog';
import ContactUsButton from 'ui/Components/ContactUsButton';
import { TextField } from '@contentful/ui-component-library';

export default class EnterpriseSpaceWizard extends React.Component {
  static propTypes = {
    ratePlans: PropTypes.array.isRequired
    // onCancel: PropTypes.func.isRequired,
    // onConfirm: PropTypes.func.isRequired,
    // onSpaceCreated: PropTypes.func.isRequired,
    // onTemplateCreated: PropTypes.func.isRequired
  }

  state = {spaceName: ''};
  plan = {};
  resources = [];

  constructor (props) {
    super(props);
    this.plan = this.props.ratePlans.find(plan => plan.productPlanType === 'free_space');
    this.resources = getIncludedResources(this.plan.productRatePlanCharges);
  }

  handleSpaceNameChange (value) {
    this.setState({spaceName: value});
  }

  handleSubmit () {
    //
  }

  render () {
    return (
      <Dialog testId="enterprise-space-creation-dialog" size="large">
        <Dialog.Header>Create a space</Dialog.Header>
        <Dialog.Body>
          <Plan plan={this.plan} resources={this.resources} />
          <Note />
          <TextField
            value={this.state.spaceName}
            name="spaceName"
            id="spaceName"
            labelText="Space name"
            required={true}
            textInputProps={{
              maxLength: 30,
              width: 'large'
            }}
            onChange={(evt) => this.handleSpaceNameChange(evt.target.value)}
          />
        </Dialog.Body>
        <Dialog.Controls>
            <button
              className="btn-action"
            >
              Confirm and create space
            </button>
        </Dialog.Controls>
      </Dialog>
    );
  }
}

function Plan ({plan, resources}) {
  return (
    <div className="space-plans-list__item">
      <div className="space-plans-list__item__heading">
        <strong data-test-id="space-plan-name">{plan.name}</strong>
        <span data-test-id="space-plan-price"> - Free</span>
      </div>
      <ul className="space-plans-list__item__features">
      {resources.map(({type, number}) => {
        const tooltip = getTooltip(type, number);
        return <li key={type}>
          {toLocaleString(number) + ' '}
          {tooltip && <Tooltip style={{display: 'inline'}} tooltip={tooltip}>
            <em className="x--underline">{pluralize(type, number)}</em>
          </Tooltip>}
          {!tooltip && pluralize(type, number)}
        </li>;
      })}
    </ul>
  </div>
  );
}
Plan.propTypes = {
  resources: PropTypes.array.isRequired,
  plan: PropTypes.object.isRequired
};

function Note () {
  return (
    <div className='note-box--info' style={{margin: '30px 0'}}>
      <p>
        {`Proof of concept spaces can't be used for production applications.
        You can create as many of them as you wish, and they can be deleteed at any time.`}
        <ContactUsButton noIcon={true} data-test-id='subscription-page.sidebar.contact-link' />
        to transform a proof of concept space into a production-ready space.
      </p>
    </div>
  );
}
