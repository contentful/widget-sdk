import React from 'react';
import PropTypes from 'prop-types';
import $rootScope from '$rootScope';
import { connect } from 'react-redux';
import { getIncludedResources } from 'components/shared/space-wizard/WizardUtils.es6';
import { go } from 'states/Navigator.es6';
import { get } from 'lodash';

import * as actionCreators from '../space-wizard/store/actionCreators.es6';

import TemplateSelector from 'components/shared/space-wizard/TemplateSelector.es6';
import ProgressScreen from 'components/shared/space-wizard/ProgressScreen.es6';
import Dialog from 'app/entity_editor/Components/Dialog';

import ContactUsButton from 'ui/Components/ContactUsButton.es6';
import EnterpriseSpaceWizardPlan from './EnterpriseSpaceWizardPlan.es6';
import EnterpriseSpaceWizardInfo from './EnterpriseSpaceWizardInfo.es6';

import { TextField } from '@contentful/ui-component-library';

class EnterpriseSpaceWizard extends React.Component {
  static propTypes = {
    freeSpaceRatePlan: PropTypes.object.isRequired,
    freeSpaceResource: PropTypes.shape({
      usage: PropTypes.number.isRequired,
      limits: PropTypes.shape({
        maximum: PropTypes.number.isRequired
      })
    }),
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

  state = {
    errorMessage: null,
    usage: this.props.freeSpaceResource.usage,
    limit: this.props.freeSpaceResource.limits.maximum,
    isDisabled: this.props.freeSpaceResource.limits.maximum.limit === 0,
    reachedLimit: this.props.freeSpaceResource.usage >= this.props.freeSpaceResource.limits.maximum,
    resources: getIncludedResources(this.props.freeSpaceRatePlan.productRatePlanCharges)
  };

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
      selectedPlan: this.props.freeSpaceRatePlan,
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
    const {
      setNewSpaceTemplate,
      templates,
      fetchTemplates,
      spaceCreation,
      freeSpaceRatePlan
    } = this.props;
    const submitted = spaceCreation.isPending;
    const { name, template } = this.props.newSpaceMeta;
    const {
      errorMessage,
      invalidName,
      isDisabled,
      usage,
      limit,
      reachedLimit,
      resources
    } = this.state;
    // we show a more robust progress indicator for the
    // template creation that happens after the space has been
    // successfully created
    const inProgress = spaceCreation.success && template;
    const showForm = !isDisabled && !reachedLimit && !inProgress;

    return (
      <Dialog testId="enterprise-space-creation-dialog" size="large">
        <Dialog.Header onCloseButtonClicked={() => this.close()}>Create a space</Dialog.Header>
        {inProgress && (
          <Dialog.Body>
            <ProgressScreen done={!spaceCreation.isPending} onConfirm={() => this.close()} />
          </Dialog.Body>
        )}

        {!inProgress && (
          <Dialog.Body>
            <EnterpriseSpaceWizardInfo />
            <EnterpriseSpaceWizardPlan
              resources={resources}
              roleSet={freeSpaceRatePlan.roleSet}
              reachedLimit={reachedLimit}
              usage={usage}
              limit={limit}
              isDisabled={isDisabled}
            />
            {showForm && (
              <React.Fragment>
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
              </React.Fragment>
            )}
            {!showForm && (
              <React.Fragment>
                {reachedLimit &&
                  !isDisabled && (
                    <p className="note-box--info">
                      {`You've created ${limit} proof of concept spaces. Delete existing ones or talk to us if you need more.`}
                    </p>
                  )}
                {isDisabled && (
                  <p className="note-box--info">{`You can't create proof of concept spaces because they're not a part of your enterprise deal with Contentful.
                  Get in touch with us if you want to create new spaces.`}</p>
                )}
                <ContactUsButton buttonType="button" noIcon>
                  Talk to us
                </ContactUsButton>
              </React.Fragment>
            )}
          </Dialog.Body>
        )}
        {showForm && (
          <Dialog.Controls>
            <button
              disabled={reachedLimit || isDisabled}
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
