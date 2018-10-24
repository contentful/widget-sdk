import React from 'react';
import { User as UserPropType } from '../PropTypes.es6';

export default class UserCard extends React.Component {
  static propTypes = {
    user: UserPropType.isRequired
  };

  render() {
    const { firstName, lastName, avatarUrl, email } = this.props.user;
    return (
      <div className="user-card">
        <img src={avatarUrl} className="user-card__avatar" />
        <div>
          <h2 className="user-card__name">{`${firstName} ${lastName}`}</h2>
          <span className="user-card__email ">{email}</span>
        </div>
      </div>
    );
  }
}
