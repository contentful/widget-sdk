import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { getIncludedResources } from 'components/shared/space-wizard/WizardUtils';

import { go } from 'states/Navigator';
import { get } from 'lodash';

import * as actionCreators from '../space-wizard/store/actionCreators';

import PlanFeatures from 'components/shared/space-wizard/PlanFeatures';
import Dialog from 'app/entity_editor/Components/Dialog';
import ContactUsButton from 'ui/Components/ContactUsButton';
import { TextField } from '@contentful/ui-component-library';

class EnterpriseSpaceWizard extends React.Component {
  static propTypes = {
    ratePlans: PropTypes.array.isRequired,
    setNewSpaceName: PropTypes.func.isRequired,
    createSpace: PropTypes.func.isRequired,
    reset: PropTypes.func.isRequired,
    organization: PropTypes.shape({
      sys: PropTypes.shape({
        id: PropTypes.string.isRequired
      }).isRequired,
      name: PropTypes.string.isRequired
    }).isRequired,
    newSpaceMeta: PropTypes.object.isRequired,
    spaceCreation: PropTypes.any,
    error: PropTypes.object,
    scope: PropTypes.any
  }

  static MAX_SPACE_NAME_LENGTH = 30;

  plan = {};
  resources = [];
  state = {
    errorMessage: null
  };

  constructor (props) {
    super(props);
    this.plan = this.props.ratePlans.find(plan => plan.productPlanType === 'free_space');
    this.resources = getIncludedResources(this.plan.productRatePlanCharges);
  }

  handleSpaceNameChange (value) {
    const name = value.trim();
    this.validateName(name);
    this.props.setNewSpaceName(name);
  }

  close () {
    this.props.scope.dialog.destroy();
  }

  handleSubmit () {
    this.validateName(get(this.props, 'newSpaceMeta.name'));

    if (this.state.invalidName) return;

    this.props.createSpace({
      action: 'create',
      organization: this.props.organization,
      currentStepId: 'confirmation',
      selectedPlan: this.plan,
      newSpaceMeta: this.props.newSpaceMeta,
      onSpaceCreated: this.handleSpaceCreated,
      onTemplateCreated: () => {},
      onConfirm: () => {
        this.close();
        this.props.reset();
      }
    });
  }

  handleSpaceCreated (newSpace) {
    return go({
      path: ['spaces', 'detail'],
      params: {spaceId: newSpace.sys.id}
    });
  }

  validateName (name) {
    let errorMessage = null;

    if (!name || !name.length) {
      errorMessage = 'Name is required';
    }

    this.setState({errorMessage});
  }

  render () {
    const submitted = get(this.props, 'spaceCreation.isPending');
    return (
      <Dialog testId="enterprise-space-creation-dialog" size="large">
        <Dialog.Header onCloseButtonClicked={() => this.close()}>Create a space</Dialog.Header>
        <Dialog.Body>
          <Plan plan={this.plan} resources={this.resources} />
          <Note />
          <TextField
            value={this.props.newSpaceMeta.name}
            name="spaceName"
            id="spaceName"
            labelText="Space name"
            required={true}
            textInputProps={{
              maxLength: 30,
              width: 'large'
            }}
            onChange={(evt) => this.handleSpaceNameChange(evt.target.value)}
            validationMessage={this.state.errorMessage}
          />
        {this.state.invalidName && <p className="cfnext-form__field-error">Invalid name</p>}
        </Dialog.Body>
        <Dialog.Controls>
            <button
              className={`btn-action ${submitted ? 'is-loading' : ''}`}
              onClick={this.handleSubmit.bind(this)}
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
    <div className="space-plans-list__item space-plans-list__item--proof-of-concept">
      <div className="space-plans-list__item__heading">
        <strong data-test-id="space-plan-name">{plan.name}</strong>
        <span data-test-id="space-plan-price"> - Free</span>
      </div>
      <PlanFeatures resources={resources} />
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
        You can create as many of them as you wish, and they can be deleted at any time. `}
        <ContactUsButton noIcon={true} data-test-id='subscription-page.sidebar.contact-link' />
        {` to transform a proof of concept space into a production-ready space.`}
      </p>
    </div>
  );
}

const mapStateToProps = state => {
  return {
    templates: state.spaceWizard.templates,
    newSpaceMeta: state.spaceWizard.newSpaceMeta,
    error: state.spaceWizard.error,
    success: state.spaceWizard.success,
    spaceCreation: state.spaceWizard.spaceCreation
  };
};

const mapDispatchToProps = {
  fetchTemplates: actionCreators.fetchTemplates,
  createSpace: actionCreators.createSpace,
  track: actionCreators.track,
  setNewSpaceName: actionCreators.setNewSpaceName,
  setNewSpaceTemplate: actionCreators.setNewSpaceTemplate,
  reset: actionCreators.reset
};

export default connect(mapStateToProps, mapDispatchToProps)(EnterpriseSpaceWizard);
