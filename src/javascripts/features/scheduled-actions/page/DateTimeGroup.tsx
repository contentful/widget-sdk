import moment from 'moment';
import _ from 'lodash';
import { AssetProps, EntryProps, ScheduledActionProps } from 'contentful-management/types';
import { ContentType } from 'core/services/SpaceEnvContext/types';
import React from 'react';
import { css } from 'emotion';
import { SectionHeading, Tag } from '@contentful/forma-36-react-components';
import tokens from '@contentful/forma-36-tokens';
import { Icon } from '@contentful/forma-36-react-components';
import ScheduledActionAction from 'app/ScheduledActions/ScheduledActionAction';
import WrappedEntityList from 'app/common/WrappedEntityList';
import { formatDate } from 'app/ScheduledActions/FormattedDateAndTime';
import { Release } from '@contentful/types';

const styles = {
  dateGroup: css({
    paddingTop: tokens.spacingL,
  }),
  dateGroupHeader: css({
    borderBottom: `1px solid ${tokens.colorElementLight}`,
    paddingBottom: tokens.spacingXs,
    marginBottom: tokens.spacingL,
  }),
  timeGroup: css({ display: 'flex', marginBottom: tokens.spacingL }),
  timeGroupHeader: css({
    marginRight: tokens.spacingM,
    marginTop: tokens.spacingS,
    textAlign: 'right',
    minWidth: '130px',
  }),
  timeGroupListWrapper: css({
    maxWidth: 'calc(100% - 146px)',
    flexGrow: 1,
    paddingLeft: tokens.spacingM,
    borderLeft: `1px solid ${tokens.colorElementLight}`,
  }),
  jobsStatusLabel: css({
    display: 'flex',
  }),
  statusTagIcon: css({
    marginRight: tokens.spacing2Xs,
  }),
};

type DateTimeGroupProps = {
  scheduledActions: ScheduledActionProps[];
  entitiesById: Record<string, EntryProps | AssetProps | Release>;
  contentTypesById: Record<string, ContentType>;
};

const TimeGroup = ({ scheduledActions, entitiesById, contentTypesById }: DateTimeGroupProps) => {
  const tagType =
    scheduledActions[0].action === ScheduledActionAction.Publish ? 'positive' : 'secondary';
  const isScheduleCompleted = scheduledActions[0].sys.status === 'succeeded';

  return (
    <div className={styles.timeGroup}>
      <div className={styles.timeGroupHeader}>
        <SectionHeading>
          {moment(scheduledActions[0].scheduledFor.datetime).format('hh:mm A')}
        </SectionHeading>
        <Tag tagType={tagType}>
          {isScheduleCompleted ? (
            <div className={styles.jobsStatusLabel}>
              <Icon className={styles.statusTagIcon} icon="CheckCircle" color={tagType} />
              <span>{`${scheduledActions[0].action}ed`}</span>
            </div>
          ) : (
            scheduledActions[0].action
          )}
        </Tag>
      </div>
      <div className={styles.timeGroupListWrapper}>
        <WrappedEntityList
          entities={scheduledActions.map((job) => entitiesById[job.entity.sys.id])}
          contentTypes={contentTypesById}
        />
      </div>
    </div>
  );
};

const DateTimeGroup = ({
  scheduledActions,
  entitiesById,
  contentTypesById,
}: DateTimeGroupProps) => {
  const timeGroups = _.chain(scheduledActions)
    .groupBy((job) => `${moment(job.scheduledFor.datetime).format('HH:mm')}-${job.action}`)
    .map((job) => job)
    .value();

  return (
    <div className={styles.dateGroup} data-test-id="scheduled-jobs-date-group">
      <SectionHeading className={styles.dateGroupHeader}>
        {formatDate(scheduledActions[0].scheduledFor.datetime)}
      </SectionHeading>
      {timeGroups.map((jobs) => (
        <TimeGroup
          scheduledActions={jobs}
          key={`${jobs[0].sys.id}-timeGroup`}
          entitiesById={entitiesById}
          contentTypesById={contentTypesById}
        />
      ))}
    </div>
  );
};

export { DateTimeGroup };
