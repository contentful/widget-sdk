import React from 'react';
import moment from 'moment';
import UnknownUser from './UserDetail/UnknownUser.es6';

/**
 * Return a relative time since the last activity of an
 * org member in the CMA.
 * @param {Object} membership Organization membership object
 */
export function getLastActivityDate(membership) {
  const dateString = membership.sys.lastActiveAt;
  const date = moment(dateString, moment.ISO_8601);
  const now = moment();

  return dateString
    ? now.diff(date, 'hour') > 1
      ? date.fromNow()
      : 'Less than an hour ago'
    : 'Not available';
}

export function getUserName({ firstName, lastName, sys }) {
  if (firstName) {
    return <span>{`${firstName} ${lastName}`}</span>;
  } else {
    return <UnknownUser id={sys.id} />;
  }
}
