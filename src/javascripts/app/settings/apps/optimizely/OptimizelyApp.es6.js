import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { cloneDeep } from 'lodash';
import Workbench from 'app/common/Workbench.es6';
import * as Analytics from 'analytics/Analytics.es6';
import * as Intercom from 'services/intercom.es6';
import FeedbackButton from 'app/common/FeedbackButton.es6';
import AppIcon from '../_common/AppIcon.es6';
import Features from './Features.es6';
import Connect from './Connect.es6';
import Projects from './Projects.es6';
import ContentTypes from './ContentTypes.es6';
import constants from './constants.es6';
import { hasVariationContainerInFieldLinkValidations } from './ReferenceField.es6';
import { getReferenceFieldsLinkingToEntry } from './ReferenceForm.es6';
import { loadProjectsFromOptimizely, loadProjectsViaProxy } from './load-projects.es6';
import { getModule } from 'NgRegistry.es6';
import * as variationContainer from './variation-container.es6';

const $state = getModule('$state');
const spaceContext = getModule('spaceContext');

import { Button, Notification, Note } from '@contentful/forma-36-react-components';

export default class OptimizelyApp extends Component {
  static propTypes = {
    app: PropTypes.shape({
      id: PropTypes.string.isRequired,
      title: PropTypes.string.isRequired,
      installed: PropTypes.bool.isRequired,
      config: PropTypes.shape({
        contentTypes: PropTypes.array,
        project: PropTypes.object,
        pat: PropTypes.string
      })
    }).isRequired,
    allContentTypes: PropTypes.array.isRequired,
    client: PropTypes.shape({
      save: PropTypes.func.isRequired,
      remove: PropTypes.func.isRequired,
      proxyGetRequest: PropTypes.func.isRequired
    }).isRequired
  };

  constructor(props) {
    super(props);

    const config = cloneDeep(props.app.config);

    this.state = {
      addedContentTypes: [],
      allProjects: null,
      busyWith: null,
      installed: props.app.installed,
      isContentTypeDialogOpen: false,
      isVariationContainerInstalled: !!props.allContentTypes.find(
        ct => ct.sys.id === constants.VARIATION_CONTAINER_CT_ID
      ),
      pat: '',
      selectedContentType: '',
      selectedProject: null,
      referenceFields: {}
    };

    if (this.state.installed) {
      this.state.addedContentTypes = config.contentTypes;
      this.state.pat = constants.PAT_PLACEHOLDER;
      this.state.selectedProject = config.project;
    }

    this.state.referenceFields = this.props.allContentTypes.reduce((fields, contentType) => {
      return {
        ...fields,
        [contentType.sys.id]: this.createReferenceFieldMap(contentType.sys.id)
      };
    }, {});
  }

  componentDidMount() {
    if (this.state.installed) {
      this.loadProjects();
    }
  }

  createReferenceFieldMap = contentTypeId => {
    return getReferenceFieldsLinkingToEntry(
      this.props.allContentTypes.find(ct => ct.sys.id === contentTypeId)
    ).reduce((map, field) => {
      return {
        ...map,
        [field.id]: hasVariationContainerInFieldLinkValidations(field)
      };
    }, {});
  };

  findRemovedContentTypes = () => {
    return (this.lastSavedConfig
      ? this.lastSavedConfig.contentTypes
      : this.props.app.config.contentTypes
    ).filter(id => !this.state.addedContentTypes.includes(id));
  };

  loadProjects = async () => {
    let allProjects, err;

    this.setState({
      busyWith: constants.CONNECTING
    });

    if (this.state.installed) {
      [allProjects, err] = await loadProjectsViaProxy(this.props.client);
    } else {
      [allProjects, err] = await loadProjectsFromOptimizely(this.state.pat);
    }

    this.setState({
      busyWith: null
    });

    if (err) {
      return Notification.error(
        "Failed to connect to your Optimizely account. Please check if you've entered a valid personal access token."
      );
    }

    if (!this.state.installed) {
      Notification.success("We've connected your Optimizely account successfully.");
    }

    this.setState({
      allProjects
    });
  };

  onClickDisconnect = async () => {
    this.setState({
      pat: '',
      allProjects: null
    });
  };

  install = async () => {
    const config = {
      contentTypes: this.state.addedContentTypes,
      project: this.state.selectedProject,
      secrets: {
        pat: this.state.pat
      }
    };

    try {
      this.setState({ busyWith: constants.INSTALL });

      config.extensionId = await variationContainer.create(config.project);
      await variationContainer.updateContentTypes(
        this.state.addedContentTypes,
        this.state.referenceFields
      );

      await this.props.client.save(this.props.app.id, config);
      this.setState({ busyWith: null, installed: true, config });
      Notification.success('Optimizely app installed successfully.');
      Analytics.track('optimizely:installed');
      Intercom.trackEvent('apps-alpha-optimizely-installed');
    } catch (err) {
      this.setState({ busyWith: null });
      notifyError(err, 'Failed to install Optimizely app. Try again!');
    }

    this.lastSavedConfig = config;
  };

  update = async () => {
    const config = {
      contentTypes: this.state.addedContentTypes,
      project: this.state.selectedProject
    };

    try {
      this.setState({ busyWith: constants.UPDATE });

      await variationContainer.updateContentTypes(
        this.state.addedContentTypes,
        this.state.referenceFields
      );

      await variationContainer.removeFromContentTypes(this.findRemovedContentTypes());

      const { extensionId } = this.lastSavedConfig || this.props.app.config;
      await variationContainer.updateUiExtension(extensionId, this.state.selectedProject);

      await this.props.client.save(this.props.app.id, config);
      this.setState({ busyWith: null, config });
      Notification.success('Optimizely app updated successfully.');
      Analytics.track('optimizely:installed');
      Intercom.trackEvent('apps-alpha-optimizely-installed');
    } catch (err) {
      this.setState({ busyWith: null });
      notifyError(err, 'Failed to update Optimizely app. Try again!');
    }

    this.lastSavedConfig = config;
  };

  uninstall = async () => {
    try {
      this.setState({ busyWith: constants.UNINSTALL });

      await variationContainer.removeFromContentTypes(this.state.addedContentTypes);

      await this.props.client.remove(this.props.app.id);

      Notification.success('Optimizely app uninstalled successfully.');
      Analytics.track('optimizely:uninstalled');
      $state.go('^.list');
    } catch (err) {
      this.setState({ busyWith: null });
      notifyError(err, 'Failed to uninstall Optimizely app. Try again!');
    }

    try {
      const config = this.lastSavedConfig || this.props.app.config;
      await spaceContext.cma.deleteExtension(config.extensionId);

      const ei = await spaceContext.cma.getEditorInterface(constants.VARIATION_CONTAINER_CT_ID);
      await spaceContext.cma.updateEditorInterface({
        sys: {
          contentType: { sys: { id: constants.VARIATION_CONTAINER_CT_ID } },
          version: ei.sys.version
        },
        controls: []
      });
    } catch (err) {
      // If we fail to uninstall the UI Extension nothing bad happens, we just
      // produce some leftovers or UIE was removed manually. Don't report errors
      // in this case. The same applies to EditorInterface cleanup.
    }
  };

  onDeleteContentType = async contentTypeId => {
    this.setState(state => ({
      addedContentTypes: state.addedContentTypes.filter(id => id !== contentTypeId)
    }));
  };

  onPATChange = event => {
    this.setState({ pat: event.target.value });
  };

  onProjectChange = event => {
    this.setState({
      selectedProject: event.target.value
    });
  };

  onSelectContentType = contentType => {
    // In case null / undefined gets passed, just set the value and return.
    if (!contentType) {
      this.setState({ selectedContentType: contentType });
      return;
    }

    this.setState(state => ({
      selectedContentType: contentType.sys.id,
      referenceFields: {
        ...state.referenceFields,
        [contentType.sys.id]:
          state.referenceFields[contentType.sys.id] ||
          this.createReferenceFieldMap(contentType.sys.id)
      }
    }));
  };

  onSelectReferenceField = ({ id, checked }) => {
    this.setState(state => ({
      referenceFields: {
        ...state.referenceFields,
        [state.selectedContentType]: {
          ...state.referenceFields[this.state.selectedContentType],
          [id]: checked
        }
      }
    }));
  };

  saveContentTypeDialog = () => {
    this.setState(state => {
      if (state.addedContentTypes.includes(state.selectedContentType)) {
        return;
      }

      return {
        addedContentTypes: [...state.addedContentTypes, state.selectedContentType]
      };
    });

    this.setContentTypeDialogAsOpen(false);
  };

  setContentTypeDialogAsOpen = open => {
    this.setState({
      isContentTypeDialogOpen: open
    });
  };

  render() {
    const { busyWith, installed, isVariationContainerInstalled } = this.state;

    return (
      <Workbench>
        <Workbench.Header>
          <Workbench.Header.Back to="^.list" />
          <Workbench.Icon>
            <AppIcon appId="optimizely" />
          </Workbench.Icon>
          <Workbench.Title>App: {this.props.app.title}</Workbench.Title>
          <Workbench.Header.Actions>
            {installed && (
              <Button
                buttonType="muted"
                disabled={!!busyWith}
                loading={busyWith === 'uninstall'}
                onClick={this.uninstall}>
                Uninstall
              </Button>
            )}
            {installed && (
              <Button
                buttonType="positive"
                disabled={!!busyWith}
                loading={busyWith === constants.UPDATE}
                onClick={this.update}>
                Save
              </Button>
            )}
            {!installed && !isVariationContainerInstalled && (
              <Button
                buttonType="positive"
                disabled={!!busyWith}
                loading={busyWith === constants.INSTALL}
                onClick={this.install}>
                Save
              </Button>
            )}
          </Workbench.Header.Actions>
        </Workbench.Header>
        <Workbench.Content centered>
          {!this.props.app.installed && this.state.isVariationContainerInstalled ? (
            <VariationContainerError />
          ) : (
            <div className="f36-margin-bottom--2xl">
              <div>
                <Note>
                  Let us know how we can improve the Optimizely app.{' '}
                  <FeedbackButton target="extensibility" about="Optimizely app" />
                </Note>
              </div>
              <Features />
              <Connect
                isConnected={!!this.state.allProjects}
                isConnecting={this.state.busyWith === constants.CONNECTING}
                pat={this.state.pat}
                onPATChange={this.onPATChange}
                onClickConnect={this.loadProjects}
                onClickDisconnect={this.onClickDisconnect}
              />
              <Projects
                allProjects={this.state.allProjects}
                onProjectChange={this.onProjectChange}
                selectedProject={this.state.selectedProject}
              />
              <ContentTypes
                addedContentTypes={this.state.addedContentTypes}
                allContentTypes={this.props.allContentTypes}
                allReferenceFields={this.state.referenceFields}
                isContentTypeDialogOpen={this.state.isContentTypeDialogOpen}
                openContentTypeDialog={() => this.setContentTypeDialogAsOpen(true)}
                closeContentTypeDialog={() => this.setContentTypeDialogAsOpen(false)}
                selectedContentType={this.state.selectedContentType}
                saveContentTypeDialog={this.saveContentTypeDialog}
                onSelectContentType={this.onSelectContentType}
                onDeleteContentType={this.onDeleteContentType}
                onSelectReferenceField={this.onSelectReferenceField}
              />
            </div>
          )}
        </Workbench.Content>
      </Workbench>
    );
  }
}

function notifyError(err, fallbackMessage) {
  Notification.error(err.useMessage ? err.message || fallbackMessage : fallbackMessage);
}

function VariationContainerError() {
  return (
    <Note noteType="negative" title="Content Type Conflict">
      A content type with {'"'}
      {constants.VARIATION_CONTAINER_CT_ID}
      {'"'} ID already exists in this space. Please rename it before installing Optimizely app.
    </Note>
  );
}
