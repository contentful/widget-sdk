import React from 'react';
import PropTypes from 'prop-types';
import CurrentUserFetcher from 'components/shared/UserFetcher/CurrentUserFetcher';
import UserFetcher from 'components/shared/UserFetcher';

/**
 * Renders the user's display name based on the user and optionally the currentUser if provided
 *
 * == See Also
 *
 * * UserNameFormatter: Uses redux which requires wrapping all uses of the component in a react-redux connect()
 * * UserNameFormatter: renders a bare string with '' for the null case, requires currentUser to be present
 */
export function UserDisplayName(props) {
  const { user, currentUser, className } = props;

  if (!user) {
    return null;
  }

  const fullName = [user.firstName, user.lastName].join(' ');

  let label = fullName;
  if (currentUser && currentUser.sys.id === user.sys.id) {
    label = 'Me';
  }

  return (
    <span className={className} title={fullName}>
      {label}
    </span>
  );
}

const userShape = PropTypes.shape({
  sys: PropTypes.shape({
    id: PropTypes.string.isRequired
  }).isRequired,
  firstName: PropTypes.string.isRequired,
  lastName: PropTypes.string
});

UserDisplayName.propTypes = {
  user: userShape.isRequired,
  currentUser: userShape,
  className: PropTypes.string
};

/**
 * Fetches and renders the specified userId's firstName and lastName or 'Me' if subject is the current user
 *
 * Uses the CurrentUserFetcher and UserFetcher to render the user's name in a <span />
 *
 * == See Also
 *
 * * FetchAndFormatUserName: Uses UserNameFormatter (see below) plus ngContext
 * * connect(UserNameFormatter):
 *   * Uses redux which requires wrapping all uses of the component in a react-redux connect()
 *   * Does not render anything if currentUser is not found (instead of reverting to the user's name)
 *
 */
export default function ConnectedUserDisplayName(props) {
  const { userId, user, className } = props;

  if (!userId && !user) {
    // One of these two must be present
    // TODO log or do something meaningful
    return null;
  }

  return (
    <CurrentUserFetcher>
      {currentUser =>
        user ? (
          <UserDisplayName user={user} currentUser={currentUser} className={className} />
        ) : (
          <UserFetcher userId={userId}>
            {({ isLoading, isError, data: user }) => {
              if (isError) {
                return null;
              }

              if (isLoading) {
                return null;
              }

              <UserDisplayName user={user} currentUser={currentUser} className={className} />;
            }}
          </UserFetcher>
        )
      }
    </CurrentUserFetcher>
  );
}

ConnectedUserDisplayName.propTypes = {
  userId: PropTypes.number,
  user: PropTypes.object,
  className: PropTypes.string
};
