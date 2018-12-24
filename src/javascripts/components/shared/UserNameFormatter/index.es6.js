import { Component } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';

/**
 * Component renders user name or Me if the user id matches logged in user.
 * Should be used only for the string presentation, if you need more advanced formatting,
 * consider using in combination with <UserFetcher /> component.
 *
 * @class UserNameFormatter
 * @extends {Component}
 */
class UserNameFormatter extends Component {
  static propTypes = {
    user: PropTypes.object,
    currentUser: PropTypes.object
  };
  render() {
    const { currentUser, user } = this.props;
    if (!currentUser || !user) {
      return '';
    } else if (currentUser.sys.id === user.sys.id) {
      return 'Me';
    } else {
      return user.firstName + ' ' + user.lastName;
    }
  }
}

const mapStateToProps = state => {
  return {
    currentUser: state.token.user
  };
};

export default connect(mapStateToProps)(UserNameFormatter);
