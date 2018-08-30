import React from 'react';
import PropTypes from 'prop-types';
import $rootScope from '$rootScope';
import { connect } from 'react-redux';
import { getIncludedResources } from 'components/shared/space-wizard/WizardUtils.es6';
import { go } from 'states/Navigator.es6';
import { get } from 'lodash';

import * as actionCreators from '../space-wizard/store/actionCreators.es6';

import TemplateSelector from 'components/shared/space-wizard/TemplateSelector.es6';
import PlanFeatures from 'components/shared/space-wizard/PlanFeatures.es6';
import ProgressScreen from 'components/shared/space-wizard/ProgressScreen.es6';
import Dialog from 'app/entity_editor/Components/Dialog';

import { TextField, TextLink } from '@contentful/ui-component-library';

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
    scope: PropTypes.shape({
      dialog: PropTypes.shape({
        destroy: PropTypes.func.isRequired,
        reposition: PropTypes.func.isRequired
      })
    })
  };

  static MAX_SPACE_NAME_LENGTH = 30;

  plan = {};
  resources = [];
  state = {
    errorMessage: null
  };

  constructor(props) {
    super(props);
    this.plan = this.props.ratePlans.find(plan => plan.productPlanType === 'free_space');
    this.resources = getIncludedResources(this.plan.productRatePlanCharges);
  }

  handleSpaceNameChange(value) {
    const name = value.trim();
    this.validateName(name);
    this.props.setNewSpaceName(name);
  }

  close() {
    this.props.scope.dialog.destroy();
    this.props.reset();
  }

  reposition() {
    this.props.scope.dialog.reposition();
  }

  handleSubmit() {
    this.validateName(get(this.props, 'newSpaceMeta.name'));

    if (this.state.invalidName) return;

    this.props.createSpace({
      action: 'create',
      organization: this.props.organization,
      currentStepId: 'confirmation',
      selectedPlan: this.plan,
      newSpaceMeta: this.props.newSpaceMeta,
      onSpaceCreated: this.handleSpaceCreated.bind(this),
      onTemplateCreated: this.handleTemplateCreated.bind(this),
      onConfirm: this.close.bind(this)
    });
  }

  handleSpaceCreated(newSpace) {
    const { template } = this.props.newSpaceMeta;
    template && this.reposition();

    return go({
      path: ['spaces', 'detail'],
      params: { spaceId: newSpace.sys.id }
    });
  }

  handleTemplateCreated() {
    $rootScope.$broadcast('spaceTemplateCreated');
  }

  validateName(name) {
    let errorMessage = null;

    if (!name || !name.length) {
      errorMessage = 'Name is required';
    }

    this.setState({ errorMessage });
  }

  render() {
    const { setNewSpaceTemplate, templates, fetchTemplates, spaceCreation } = this.props;
    const submitted = spaceCreation.isPending;
    const { name, template } = this.props.newSpaceMeta;
    const { errorMessage, invalidName } = this.state;
    // we show a more robust progress indicator for the
    // template creation that happens after the space has been
    // successfully created
    const showProgress = spaceCreation.success && template;

    return (
      <Dialog testId="enterprise-space-creation-dialog" size="large">
        <Dialog.Header onCloseButtonClicked={() => this.close()}>Create a space</Dialog.Header>
        {showProgress && (
          <Dialog.Body>
            <ProgressScreen done={!spaceCreation.isPending} onConfirm={() => this.close()} />
          </Dialog.Body>
        )}
        {!showProgress && (
          <Dialog.Body>
            <Info />
            <Plan resources={this.resources} roleSet={this.plan.roleSet} />
            <TextField
              countCharacters
              required
              style={{ marginBottom: '30px', display: 'inline-block' }}
              value={name || ''}
              name="spaceName"
              id="spaceName"
              labelText="Space name"
              helpText="Can have up to 30 characters"
              textInputProps={{
                maxLength: 30,
                width: 'large'
              }}
              onChange={evt => this.handleSpaceNameChange(evt.target.value)}
              validationMessage={errorMessage}
            />
            {invalidName && <p className="cfnext-form__field-error">Invalid name</p>}

            <TemplateSelector
              onSelect={setNewSpaceTemplate}
              onToggle={() => this.reposition()}
              templates={templates}
              fetchTemplates={fetchTemplates}
              formAlign="left"
            />
          </Dialog.Body>
        )}
        {!showProgress && (
          <Dialog.Controls>
            <button
              className={`btn-action ${submitted ? 'is-loading' : ''}`}
              onClick={this.handleSubmit.bind(this)}>
              Confirm and create space
            </button>
          </Dialog.Controls>
        )}
      </Dialog>
    );
  }
}

function Plan({ resources, roleSet }) {
  return (
    <div
      className="space-plans-list__item space-plans-list__item--proof-of-concept"
      style={{ marginBottom: '30px' }}>
      <div className="space-plans-list__item__heading">
        <strong data-test-id="space-plan-name">Proof of concept</strong>
        <span data-test-id="space-plan-price"> - Free</span>
      </div>
      <PlanFeatures resources={resources} roleSet={roleSet} />
    </div>
  );
}
Plan.propTypes = {
  resources: PropTypes.array.isRequired,
  roleSet: PropTypes.object.isRequired
};

class Info extends React.Component {
  state = {
    showingMore: false
  };

  get showMoreText() {
    return this.state.showingMore ? 'Show less' : 'Show more';
  }

  onShowMore() {
    this.setState({ showingMore: !this.state.showingMore });
  }

  render() {
    return (
      <section style={{ marginBottom: '30px' }}>
        <p className="enterprise-space-wizard__info" style={{ display: 'inline' }}>
          {`Use a proof of concept space to experiment or start new projects. Talk to us when you decide to launch. `}
        </p>
        {this.state.showingMore && (
          <div style={{ marginTop: '20px' }}>
            <p style={{ marginBottom: '20px' }}>
              {`A proof of concept space is free of charge until you decide to use it for a live application.
                We can then help you to convert it to a regular production space.`}
            </p>
            <p style={{ marginBottom: '20px' }}>
              {`Proof of concept spaces share the same limits for API requests and asset bandwidth with the
                other spaces in your organization. `}
              <a
                href="https://www.contentful.com/r/knowledgebase/fair-use/#poc-proof-of-concept-limited-use-case"
                target="blank">
                Learn more
              </a>
            </p>
          </div>
        )}
        <TextLink onClick={() => this.onShowMore()}>{this.showMoreText}</TextLink>
      </section>
    );
  }
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

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(EnterpriseSpaceWizard);
