import React, { Component } from 'react';
import PropTypes from 'prop-types';
import ScheduledActionsListPage from '../list/ScheduledActionsListPage';

import StateRedirect from 'app/common/StateRedirect';

import ScheduledActionsFeatureFlag from '../ScheduledActionsFeatureFlag';

export default class ScheduledActionsListRoute extends Component {
  static propTypes = {
    spaceId: PropTypes.string.isRequired,
    environmentId: PropTypes.string.isRequired,
    contentTypes: PropTypes.array.isRequired,
    defaultLocale: PropTypes.object
  };

  render() {
    return (
      <ScheduledActionsFeatureFlag>
        {({ currentVariation }) => {
          if (currentVariation === true) {
            return (
              <ScheduledActionsListPage
                spaceId={this.props.spaceId}
                environmentId={this.props.environmentId}
                defaultLocale={this.props.defaultLocale}
                contentTypes={this.props.contentTypes}
              />
            );
          } else if (currentVariation === false) {
            return <StateRedirect to="spaces.detail.entries.list" />;
          } else {
            return null;
          }
        }}
      </ScheduledActionsFeatureFlag>
    );
  }
}
