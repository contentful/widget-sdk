import React from 'react';
import PropTypes from 'prop-types';
import $rootScope from '$rootScope';
import { connect } from 'react-redux';
import { getIncludedResources } from 'components/shared/space-wizard/WizardUtils';
import { go } from 'states/Navigator';
import { get } from 'lodash';

import * as actionCreators from '../space-wizard/store/actionCreators';

import TemplateSelector from 'components/shared/space-wizard/TemplateSelector';
import PlanFeatures from 'components/shared/space-wizard/PlanFeatures';
import ProgressScreen from 'components/shared/space-wizard/ProgressScreen';
import Dialog from 'app/entity_editor/Components/Dialog';
import ContactUsButton from 'ui/Components/ContactUsButton';

import { TextField } from '@contentful/ui-component-library';

class EnterpriseSpaceWizard extends React.Component {
  static propTypes = {
    ratePlans: PropTypes.array.isRequired,
    setNewSpaceName: PropTypes.func.isRequired,
    setNewSpaceTemplate: PropTypes.func.isRequired,
    createSpace: PropTypes.func.isRequired,
    reset: PropTypes.func.isRequired,
    organization: PropTypes.shape({
      sys: PropTypes.shape({
        id: PropTypes.string.isRequired
      }).isRequired,
      name: PropTypes.string.isRequired
    }).isRequired,
    newSpaceMeta: PropTypes.object.isRequired,
    fetchTemplates: PropTypes.func.isRequired,
    templates: PropTypes.object.isRequired,
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
    this.props.reset();
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
      onTemplateCreated: this.handleTemplateCreated,
      onConfirm: this.close
    });
  }

  handleSpaceCreated (newSpace) {
    return go({
      path: ['spaces', 'detail'],
      params: {spaceId: newSpace.sys.id}
    });
  }

  handleTemplateCreated () {
    $rootScope.$broadcast('spaceTemplateCreated');
  }

  validateName (name) {
    let errorMessage = null;

    if (!name || !name.length) {
      errorMessage = 'Name is required';
    }

    this.setState({errorMessage});
  }

  render () {
    const {
      setNewSpaceTemplate,
      templates,
      fetchTemplates,
      spaceCreation
    } = this.props;
    const submitted = spaceCreation.isPending;
    const {name, template} = this.props.newSpaceMeta;
    const {errorMessage, invalidName} = this.state;
    // we show a more robust progress indicator for the
    // template creation that happens after the space has been
    // successfully created
    const showProgress = spaceCreation.success && template;

    return (
      <Dialog testId="enterprise-space-creation-dialog" size="large">
        <Dialog.Header onCloseButtonClicked={() => this.close()}>Create a space</Dialog.Header>
        <Dialog.Body>
          {showProgress &&
            <ProgressScreen done={!spaceCreation.isPending} onConfirm={this.close} />
          }
          {!showProgress &&
            <div>
              <Plan plan={this.plan} resources={this.resources} />
              <Note />
              <TextField
                value={name}
                name="spaceName"
                id="spaceName"
                labelText="Space name"
                required={true}
                textInputProps={{
                  maxLength: 30,
                  width: 'large'
                }}
                onChange={(evt) => this.handleSpaceNameChange(evt.target.value)}
                validationMessage={errorMessage}
              />
              {invalidName && <p className="cfnext-form__field-error">Invalid name</p>}

              <TemplateSelector
                onSelect={setNewSpaceTemplate}
                templates={templates}
                fetchTemplates={fetchTemplates}
              />
            </div>
          }
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
    spaceCreation: state.spaceWizard.spaceCreation,
    spaceCreationTempalte: state.spaceWizard.spaceCreationTemplate
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
