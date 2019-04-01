import { Component } from 'react';
import PropTypes from 'prop-types';
import React from 'react';

import { getModule } from 'NgRegistry.es6';
import { getOrgFeature } from 'data/CMA/ProductCatalog.es6';
import AppIcon from '../_common/AppIcon.es6';
import Workbench from 'app/common/Workbench.es6';
import AppPageShell from '../_common/AppPageShell.es6';

import { ImageManagementInstaller } from './ImageManagementInstaller.es6';
import { ImageManagementGettingStarted } from './ImageManagementGettingStarted.es6';
import { APP_ID, APP_NAME, CUSTOM_SIDEBAR_FEATURE_ID } from './Constants.es6';

const spaceContext = getModule('spaceContext');

export default class ImageManagementApp extends Component {
  static propTypes = {
    client: PropTypes.shape({
      get: PropTypes.func.isRequired
    }).isRequired
  };

  constructor(props) {
    super(props);
    this.state = {
      loading: true
    };
  }

  async componentDidMount() {
    await this.reloadConfig();
  }

  reloadConfig = async () => {
    this.setState({
      loading: true
    });

    const [hasCustomSidebar, config, contentTypes] = await Promise.all([
      getOrgFeature(spaceContext.organization.sys.id, CUSTOM_SIDEBAR_FEATURE_ID, true),
      this.props.client.get(APP_ID),
      spaceContext.publishedCTs.getAllBare()
    ]);

    this.setState({
      installed: config.installed,
      contentTypeName: config.config ? config.config.contentTypeName : null,
      hasCustomSidebar: hasCustomSidebar,
      existingContentTypeNames: (contentTypes || []).map(ct => ct.name),
      loading: false
    });
  };

  render() {
    if (this.state.loading) {
      return <AppPageShell appId={APP_ID} />;
    }

    return (
      <Workbench>
        <Workbench.Header>
          <Workbench.Header.Back to="^.list" />
          <Workbench.Icon>
            <AppIcon appId={APP_ID} />
          </Workbench.Icon>
          <Workbench.Title>App: {APP_NAME}</Workbench.Title>
        </Workbench.Header>
        <Workbench.Content centered>
          {this.state.installed ? (
            <ImageManagementGettingStarted
              client={this.props.client}
              onUninstallCompleted={this.reloadConfig}
              hasCustomSidebar={this.state.hasCustomSidebar}
              contentTypeName={this.state.contentTypeName}
            />
          ) : (
            <ImageManagementInstaller
              client={this.props.client}
              onInstallCompleted={this.reloadConfig}
              hasCustomSidebar={this.state.hasCustomSidebar}
              existingContentTypeNames={this.state.existingContentTypeNames}
            />
          )}
        </Workbench.Content>
      </Workbench>
    );
  }
}
