import React from 'react';
import { cx, css } from 'emotion';
import { Tooltip } from '@contentful/forma-36-react-components';
import tokens from '@contentful/forma-36-tokens';
import truncateMiddle from 'truncate-middle';
import { User } from 'app/OrganizationSettings/PropTypes';

const styles = {
  userLink: css({
    display: 'flex',
    alignItems: 'center',
    padding: `${tokens.spacingS} ${tokens.spacingL}`,
    fontSize: tokens.fontSizeM,
    lineHeight: tokens.lineHeightDefault,
  }),
  statusUnconfirmed: css({
    color: tokens.colorTextLight,
    a: css({
      color: tokens.colorTextLight,
      textDecoration: 'underline',
    }),
  }),
  entityLinkImage: css({
    flex: 0,
    width: '37.5px',
    minWidth: '37.5px',
    height: '37.5px',
    border: `1px solid ${tokens.colorElementDark}`,
    marginRight: tokens.spacingM,
  }),
  entityTextLink: css({
    width: tokens.contentWidthFull,
    '> *:first-child': {
      fontSize: tokens.fontSizeM,
    },
    '> *:not(:first-child)': {
      color: tokens.colorTextLight,
    },
  }),
};

const UserLink = ({ user }) => {
  const unconfirmedUserMessage = (condition) => {
    const tooltipMessage = user.activated
      ? 'This user hasn’t confirmed their email address yet. Therefore  we can’t guarantee the identity of the user'
      : 'This user hasn’t accepted the invitation to your organization yet.';

    return condition ? (
      <span className={cx(styles.statusUnconfirmed, 'user-link__unconfirmed')}>
        <Tooltip content={tooltipMessage} place="bottom" testId="user-details-tooltip">
          <span data-test-id="user-details-tooltip-trigger">
            &nbsp;{user.activated ? '(not confirmed)' : '(hasn’t accepted invitation)'}
          </span>
        </Tooltip>
      </span>
    ) : null;
  };

  return (
    <div className={cx(styles.userLink, 'user-link')} data-user-email={user.email}>
      <img className={styles.entityLinkImage} src={user.avatarUrl} />
      <div className={styles.entityTextLink}>
        {(user.firstName || user.lastName) && (
          <div className={styles.userDetails} data-test-id="user-details">
            {user.firstName} {user.lastName}
            {unconfirmedUserMessage(!user.confirmed)}
          </div>
        )}
        <div>
          <span data-test-id="user-details-extra">
            {truncateMiddle(user.email, 45, 15)}
            {unconfirmedUserMessage(!user.confirmed && !user.firstName && !user.lastName)}
          </span>
        </div>
      </div>
    </div>
  );
};

UserLink.propTypes = {
  user: User,
};

export default UserLink;
