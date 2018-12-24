import React, { Component } from 'react';
import PropTypes from 'prop-types';

import UserFetcher from 'components/shared/UserFetcher/index.es6';
import UserNameFormatter from './index.es6';

/**
 * Component renders user name or Me if the user id matches logged in user.
 * Should be used only for the string presentation, if you need more advanced formatting,
 * consider extracting <UserFetcher /> component.
 *
 * @class UserNameFormatter
 * @extends {Component}
 */
class FetchAndFormatUserName extends Component {
  static propTypes = {
    userId: PropTypes.string
  };
  render() {
    return (
      <UserFetcher userId={this.props.userId}>
        {({ isLoading, isError, data }) => {
          if (isLoading) {
            return 'Loading user data';
          }
          if (isError) {
            return null;
          }
          return <UserNameFormatter user={data} />;
        }}
      </UserFetcher>
    );
  }
}

export default FetchAndFormatUserName;
