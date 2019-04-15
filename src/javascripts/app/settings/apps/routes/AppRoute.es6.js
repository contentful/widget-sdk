import React, { Component } from 'react';
import PropTypes from 'prop-types';

import AdminOnly from 'app/common/AdminOnly.es6';
import StateRedirect from 'app/common/StateRedirect.es6';
import createAppsClient from '../AppsClient.es6';
import NetlifyApp from '../netlify/index.es6';
import AlgoliaApp from '../algolia/index.es6';
import ImageManagementApp from '../image-management/index.es6';
import { APP_ID as IMAGE_MANAGEMENT_APP_ID } from '../image-management/Constants.es6';
import ApprovalWorkflowApp from '../basicApprovalWorkflow/index.es6';

const APP_ID_TO_COMPONENT = {
  netlify: NetlifyApp,
  algolia: AlgoliaApp,
  [IMAGE_MANAGEMENT_APP_ID]: ImageManagementApp,
  basicApprovalWorkflow: ApprovalWorkflowApp
};

export default class AppRoute extends Component {
  static propTypes = {
    isEnabled: PropTypes.bool.isRequired,
    spaceId: PropTypes.string.isRequired,
    appId: PropTypes.string.isRequired
  };

  constructor(props) {
    super(props);
    this.client = createAppsClient(props.spaceId);
  }

  render() {
    const Component = APP_ID_TO_COMPONENT[this.props.appId];
    const available = this.props.isEnabled && Component;

    if (!available) {
      return <StateRedirect to="^.list" />;
    }

    return (
      <AdminOnly>
        <Component client={this.client} />
      </AdminOnly>
    );
  }
}
