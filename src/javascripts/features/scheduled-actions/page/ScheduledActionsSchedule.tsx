import React, { useMemo } from 'react';
import _ from 'lodash';
import moment from 'moment';
import { ScheduledActionsEmptyStateMessage } from './ScheduledActionsEmptyStateMessage';
import { DateTimeGroup } from './DateTimeGroup';
import { AssetProps, EntryProps, ScheduledActionProps } from 'contentful-management/types';
import { ContentType } from 'core/services/SpaceEnvContext/types';
import { Release } from '@contentful/types';

type ScheduledActionsScheduleProps = {
  scheduledActions: ScheduledActionProps[];
  entitiesById: Record<string, EntryProps | AssetProps | Release>;
  contentTypesById: Record<string, ContentType>;
  emptyStateMessage: {
    title: string;
    text: string;
  };
};

const ScheduledActionsSchedule = ({
  scheduledActions,
  entitiesById,
  contentTypesById,
  emptyStateMessage,
}: ScheduledActionsScheduleProps) => {
  const groupedJobs = useMemo(() => {
    if (!scheduledActions.length) {
      return [];
    }

    const jobsWithExisitingEntity = scheduledActions.filter(
      (job) => entitiesById[job.entity.sys.id]
    );
    const groupedJobs = _.chain(jobsWithExisitingEntity)
      .groupBy((item) => moment(item.scheduledFor.datetime).format('YYYY.MM.DD'))
      .map((item) => item)
      .value();

    return groupedJobs;
  }, [scheduledActions]);

  if (!scheduledActions.length) {
    return null;
  }

  if (!groupedJobs.length) {
    return (
      <ScheduledActionsEmptyStateMessage
        title={emptyStateMessage.title}
        text={emptyStateMessage.text}
      />
    );
  }

  return (
    <div>
      {groupedJobs.map((jobsGroup) => (
        <DateTimeGroup
          scheduledActions={jobsGroup}
          key={`${jobsGroup[0].sys.id}-dateGroup`}
          entitiesById={entitiesById}
          contentTypesById={contentTypesById}
        />
      ))}
    </div>
  );
};

export { ScheduledActionsSchedule };
