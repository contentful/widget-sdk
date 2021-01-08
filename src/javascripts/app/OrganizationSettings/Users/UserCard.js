import React from 'react';
import PropTypes from 'prop-types';
import { User as UserPropType } from 'app/OrganizationSettings/PropTypes';
import { Tag, Heading } from '@contentful/forma-36-react-components';
import { MembershipStatus } from 'utils/MembershipUtils';

const CardSizes = {
  SMALL: 'small',
  LARGE: 'large',
};

const CardClassNames = {
  [CardSizes.SMALL]: 'user-card--small',
  [CardSizes.LARGE]: 'user-card--large',
};

export default class UserCard extends React.Component {
  static propTypes = {
    user: UserPropType.isRequired,
    size: PropTypes.oneOf(Object.values(CardSizes)),
    status: PropTypes.oneOf(Object.values(MembershipStatus)),
    description: PropTypes.string,
    displayEmail: PropTypes.bool,
  };

  static defaultProps = {
    size: CardSizes.SMALL,
    status: MembershipStatus.ACTIVE,
    displayEmail: true,
  };

  shouldShowInvitedTag = () => {
    const { status, user } = this.props;
    return status === MembershipStatus.PENDING || !user.firstName;
  };

  render() {
    const {
      user: { firstName, lastName, avatarUrl, email },
      size,
      description,
      displayEmail,
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
          {(displayEmail || !firstName) && (
            <span className="user-card__email" data-test-id="user-card.email">
              {email}
            </span>
          )}
          {description && (
            <span className="user-card__description" data-test-id="user-card.description">
              {description}
            </span>
          )}
        </div>
      </div>
    );
  }
}
