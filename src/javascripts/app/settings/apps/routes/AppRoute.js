import React, { Component } from 'react';
import PropTypes from 'prop-types';

import AdminOnly from 'app/common/AdminOnly';
import StateRedirect from 'app/common/StateRedirect';
import createAppsClient from '../AppsClient';
import NetlifyApp from '../netlify/index';
import AlgoliaApp from '../algolia/index';
import ImageManagementApp from '../image-management/index';
import { APP_ID as IMAGE_MANAGEMENT_APP_ID } from '../image-management/Constants';
import ApprovalWorkflowApp from '../basicApprovalWorkflow/index';

const APP_ID_TO_COMPONENT = {
  netlify: NetlifyApp,
  algolia: AlgoliaApp,
  [IMAGE_MANAGEMENT_APP_ID]: ImageManagementApp,
  basicApprovalWorkflow: ApprovalWorkflowApp
};

export default class AppRoute extends Component {
  static propTypes = {
    spaceId: PropTypes.string.isRequired,
    appId: PropTypes.string.isRequired
  };

  constructor(props) {
    super(props);
    this.client = createAppsClient(props.spaceId);
  }

  render() {
    const Component = APP_ID_TO_COMPONENT[this.props.appId];

    if (!Component) {
      return <StateRedirect to="^.list" />;
    }

    return (
      <AdminOnly>
        <Component client={this.client} />
      </AdminOnly>
    );
  }
}
