import React, { Component } from 'react';
import PropTypes from 'prop-types';

import AdminOnly from 'app/common/AdminOnly.es6';
import StateRedirect from 'app/common/StateRedirect.es6';

import createAppsClient from '../AppsClient.es6';
import NetlifyApp from '../netlify/index.es6';
import AlgoliaApp from '../algolia/index.es6';

const APP_ID_TO_COMPONENT = {
  netlify: NetlifyApp,
  algolia: AlgoliaApp
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
        <Component client={this.client} />;
      </AdminOnly>
    );
  }
}
