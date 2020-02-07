import React from 'react';
import PropTypes from 'prop-types';
import { User as UserPropType } from 'app/OrganizationSettings/PropTypes';
import { Tag, Heading } from '@contentful/forma-36-react-components';

const CardSizes = {
  SMALL: 'small',
  LARGE: 'large'
};

const MembershipStatus = {
  ACTIVE: 'active',
  PENDING: 'pending'
};

const CardClassNames = {
  [CardSizes.SMALL]: 'user-card--small',
  [CardSizes.LARGE]: 'user-card--large'
};

export default class UserCard extends React.Component {
  static propTypes = {
    user: UserPropType.isRequired,
    size: PropTypes.oneOf(Object.values(CardSizes)),
    status: PropTypes.oneOf(Object.values(MembershipStatus))
  };

  static defaultProps = {
    size: CardSizes.SMALL,
    status: MembershipStatus.ACTIVE
  };

  shouldShowInvitedTag = () => {
    const { status, user } = this.props;
    return status === MembershipStatus.PENDING || !user.firstName;
  };

  render() {
    const {
      user: { firstName, lastName, avatarUrl, email },
      size
    } = this.props;

    return (
      <div
        data-test-id="user-card"
        className={`
        user-card
        ${CardClassNames[size]}
      `}>
        <img src={avatarUrl} className="user-card__avatar" data-test-id="user-card.avatar" />
        <div>
          {this.shouldShowInvitedTag() && (
            <Tag testId="user-card.status" tagType="warning">
              Invited
            </Tag>
          )}
          <Heading element="h2" className="user-card__name" testId="user-card.name">
            {firstName} {lastName}
          </Heading>
          <span className="user-card__email" data-test-id="user-card.email">
            {email}
          </span>
        </div>
      </div>
    );
  }
}
