import React from 'react';
import PropTypes from 'prop-types';
import { User as UserPropType } from './PropTypes.es6';

import { Tag } from '@contentful/ui-component-library';

const CardSizes = {
  SMALL: 'small',
  LARGE: 'large'
};

const CardClassNames = {
  [CardSizes.SMALL]: 'user-card--small',
  [CardSizes.LARGE]: 'user-card--large'
};

export default class UserCard extends React.Component {
  static propTypes = {
    user: UserPropType.isRequired,
    size: PropTypes.oneOf(Object.values(CardSizes))
  };

  static defaultProps = {
    size: CardSizes.SMALL
  };

  render() {
    const {
      user: { firstName, lastName, avatarUrl, email },
      size
    } = this.props;
    return (
      <div
        className={`
        user-card
        ${CardClassNames[size]}
      `}>
        <img src={avatarUrl} className="user-card__avatar" />
        <div>
          <h2 className="user-card__name">
            {firstName ? `${firstName} ${lastName}` : <Tag tagType="warning">Invited</Tag>}
          </h2>
          <span className="user-card__email ">{email}</span>
        </div>
      </div>
    );
  }
}
