import React, { Component } from 'react';
import PropTypes from 'prop-types';

import UserFetcher from 'components/shared/UserFetcher/index.es6';
import UserNameFormatter from './index.es6';

/**
 * A wrapper around UserNameFormatter that fetches user and passes the data
 * further to the Formatter.
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
