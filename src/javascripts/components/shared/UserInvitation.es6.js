import React from 'react';
import PropTypes from 'prop-types';
import FullScreen from 'components/react/molecules/FullScreen.es6';

export default class UserInvitation extends React.Component {
  static propTypes = {
    title: PropTypes.string,
    error: PropTypes.object
  };

  render() {
    const { title, error } = this.props;

    return (
      <FullScreen>
        {!error && <h1>{title}</h1>}
        {error && <h2>An error occurred: {error}</h2>}
      </FullScreen>
    );
  }
}
