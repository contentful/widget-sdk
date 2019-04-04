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

import { MAX_FEED_SIZE } from './stream.es6';

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

const renderActivityText = (activity, fieldIdNameMap) => {
  if (activity.verb === 'changed' && get(activity, 'path')) {
    const fieldName = fieldIdNameMap[activity.path[1]];
    if (!fieldName) {
      return <span title={fieldName}>Inaccessible field changed</span>;
    }
    const fieldLabel = fieldName.length > 14 ? `${fieldName.slice(0, 13).trim()}...` : fieldName;
    return <span title={fieldName}>{`Field "${fieldLabel}" changed`}</span>;
  }

  return <span>Entry {activity.verb}</span>;
};

const renderDailyActivity = fieldIdNameMap => {
  return (activity, index, activities) => {
    const activityIsInNewDay =
      moment(activity.time).format('L') !==
        moment(get(activities[index - 1], 'time')).format('L') || index === 0;
    return (
      <React.Fragment key={activity.time}>
        {activityIsInNewDay && renderDayHeader(activity, index)}
        <li className="collaborators__item entity-sidebar__no-users collaborators__item-flex">
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
            {renderActivityText(activity, fieldIdNameMap)}
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
};
const className = css({
  maxHeight: '350px',
  overflowY: 'auto'
});

export default function EntryActivityWidget({ activities = [], fieldIdNameMap = {} }) {
  return (
    <React.Fragment>
      <p
        className="entity-sidebar__help-text f36-margin-bottom--xl"
        role="note"
        aria-multiselectable="false">
        List of{' '}
        <Tooltip content="This includes all changes except those made through UI Extensions, API, and/or rollback to previous versions">
          <span className={css({ textDecoration: 'underline dotted' })}> changes</span>
        </Tooltip>{' '}
        to this entry made within the Contentful Web app.
      </p>
      <ul className={className}>
        {activities.map(renderDailyActivity(fieldIdNameMap))}
        {activities.length === MAX_FEED_SIZE && (
          <li
            className={`collaborators__item entity-sidebar__no-users collaborators__item-flex f36-margin-top--l ${css(
              {
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }
            )}`}>
            {`Limit of ${MAX_FEED_SIZE} changes reached`}
          </li>
        )}
      </ul>
    </React.Fragment>
  );
}

EntryActivityWidget.propTypes = {
  activities: PropTypes.arrayOf(
    PropTypes.shape({
      verb: PropTypes.string.isRequired,
      user_id: PropTypes.string.isRequired,
      time: PropTypes.string.isRequired,
      id: PropTypes.string.isRequired
    })
  ).isRequired,
  fieldIdNameMap: PropTypes.object.isRequired
};
