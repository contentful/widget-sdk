import React from 'react';
import PropTypes from 'prop-types';
import moment from 'moment';
import { get } from 'lodash';
import { css } from 'emotion';
import cn from 'classnames';

import { Tooltip } from '@contentful/forma-36-react-components';

import UserFetcher from 'components/shared/UserFetcher/index.es6';
import { FetcherLoading } from 'app/common/createFetcherComponent.es6';
import UserNameFormatter from 'components/shared/UserNameFormatter/index.es6';

const renderDayHeader = (activity, index) => {
  const time = new Date(activity.time);
  return (
    <li
      key={`activity-day-${activity.time}`}
      className={cn({
        'f36-font-weight--medium': true,
        'collaborators__item-flex': true,
        'f36-margin-bottom--s': true,
        'f36-margin-top--l': index !== 0
      })}
      style={{ color: '#8091a5' }}>
      <div>{moment.utc(time).format('dddd, MMMM Do')}</div>
      <div>{moment.utc(time).format('YYYY')}</div>
    </li>
  );
};

const renderDailyActivity = (activity, index, activities) => {
  return (
    <React.Fragment key={`${activity.time}`}>
      {(moment(activity.time).format('L') !==
        moment(get(activities[index - 1], 'time')).format('L') ||
        index === 0) &&
        renderDayHeader(activity, index)}
      <li
        className="collaborators__item entity-sidebar__no-users collaborators__item-flex"
        key={`${activity.verb}-${activity.time}`}>
        <div className="collaborators__item-flex">
          <UserFetcher userId={activity.user_id}>
            {({ isLoading, isError, data: user }) => {
              if (isLoading) {
                return <FetcherLoading />;
              }
              if (isError || !user) {
                return null;
              }
              return (
                <Tooltip content={<UserNameFormatter user={user} />}>
                  <img
                    className="collaborators__avatar collaborators__avatar-circle f36-margin-right--s"
                    src={user.avatarUrl}
                  />
                </Tooltip>
              );
            }}
          </UserFetcher>
          <span>Entry {activity.verb}</span>
        </div>
        <div>
          {moment
            .utc(activity.time)
            .local()
            .format('HH:mm')}
        </div>
      </li>
    </React.Fragment>
  );
};
const className = css({
  maxHeight: '350px',
  overflowY: 'auto'
});

export default function EntryActivityWidget({ activities = [] }) {
  return <ul className={className}>{activities.map(renderDailyActivity)}</ul>;
}

EntryActivityWidget.propTypes = {
  activities: PropTypes.arrayOf(
    PropTypes.shape({
      verb: PropTypes.string.isRequired,
      user_id: PropTypes.string.isRequired,
      time: PropTypes.string.isRequired,
      id: PropTypes.string.isRequired
    })
  )
};
