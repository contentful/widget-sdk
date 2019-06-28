import React, { useCallback, useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import moment from 'moment';

import ErrorHandler from 'components/shared/ErrorHandlerComponent.es6';

import {
  SkeletonContainer,
  SkeletonBodyText,
  Note,
  TextLink,
  Notification
} from '@contentful/forma-36-react-components';
import StatusButton from './StatusButton.es6';
import JobDialog from './JobDialog/index.es6';

import * as EndpointFactory from 'data/EndpointFactory.es6';

import { useAsyncFn } from 'app/common/hooks/useAsync.es6';
import usePrevious from 'app/common/hooks/usePrevious.es6';

import JobsTimeline from './JobsTimeline/index.es6';

import * as JobsService from '../DataManagement/JobsService.es6';
import { create as createDto } from './JobsFactory.es6';
import FailedScheduleNote from './FailedScheduleNote/index.es6';

function shouldShowErrorNote(lastJob, entity) {
  if (!lastJob) {
    return false;
  }

  if (entity.sys.publishedAt) {
    const entryPublishedAfterLastFailedJob = moment(entity.sys.publishedAt).isAfter(
      lastJob.scheduledAt
    );

    if (entryPublishedAfterLastFailedJob) {
      return false;
    }
  }

  const isFailed = lastJob.sys.status === 'failed';
  return isFailed;
}

function shouldShowSuccessToast(prevLastJob, lastJob, entity) {
  if (entity.sys.publishedAt && prevLastJob && lastJob) {
    if (
      prevLastJob.sys.id === lastJob.sys.id &&
      prevLastJob.sys.status === 'pending' &&
      lastJob.sys.status === 'done'
    ) {
      return true;
    }
  }
  return false;
}

function getPublishedAt(entity) {
  // HACK: sys.publishedAt from the api and sharejs can be different
  // therefore we cut precision to reduce number of false positives
  if (entity.sys.publishedAt) {
    return moment(entity.sys.publishedAt)
      .milliseconds(0)
      .toISOString();
  }
}

export default function JobWidget({
  spaceId,
  environmentId,
  userId,
  entity,
  status,
  primary,
  secondary,
  revert,
  isSaving,
  updatedAt
}) {
  const [jobs, setJobs] = useState([]);
  const [isDialogShown, setIsDialogShown] = useState(false);
  const publishedAt = getPublishedAt(entity);
  const [{ isLoading, error }, runAsync] = useAsyncFn(
    useCallback(async () => {
      const jobCollection = await JobsService.getJobs(
        EndpointFactory.createSpaceEndpoint(spaceId, environmentId),
        {
          'sys.entity.sys.id': entity.sys.id,
          order: '-sys.scheduledAt'
        }
      );
      // TODO: remove after implementing status filter in the api
      setJobs(jobCollection.items.filter(j => j.sys.status !== 'canceled'));

      return jobCollection;
    }, [spaceId, environmentId, entity.sys.id]),
    true
  );

  useEffect(() => {
    runAsync();
  }, [runAsync, publishedAt]);

  const handleCreate = ({ scheduledAt }) => {
    JobsService.createJob(
      EndpointFactory.createSpaceEndpoint(spaceId, environmentId),
      createDto({
        spaceId,
        environmentId,
        userId,
        entityId: entity.sys.id,
        action: 'publish',
        scheduledAt
      })
    ).then(job => {
      setJobs([job, ...jobs]);
    });
  };

  const handleCancel = jobId => {
    JobsService.cancelJob(EndpointFactory.createSpaceEndpoint(spaceId, environmentId), jobId).then(
      () => {
        setJobs(jobs.slice(1));
        Notification.success('Schedule cancelled');
      }
    );
  };

  const pendingJobs = jobs.filter(job => job.sys.status === 'pending');
  const hasScheduledActions = pendingJobs.length > 0;

  const lastJob = jobs[0];
  const prevLastJob = usePrevious(lastJob);
  const showToast = shouldShowSuccessToast(prevLastJob, lastJob, entity);
  useEffect(() => {
    if (showToast) {
      Notification.success('Entry was successfully published.');
    }
  }, [showToast]);

  return (
    <ErrorHandler>
      {isLoading && (
        <SkeletonContainer data-test-id="jobs-skeleton">
          <SkeletonBodyText numberOfLines={2} />
        </SkeletonContainer>
      )}
      {error && (
        <Note noteType="warning">
          We were unable to load the schedule for this entry.{' '}
          <TextLink onClick={() => window.location.reload()}>Please refresh.</TextLink>
        </Note>
      )}
      {!isLoading && !error && (
        <>
          <StatusButton
            status={status}
            primary={primary}
            secondary={secondary}
            revert={revert}
            isSaving={isSaving}
            updatedAt={updatedAt}
            onScheduledPublishClick={() => setIsDialogShown(true)}
            isDisabled={hasScheduledActions}
          />
          {shouldShowErrorNote(lastJob, entity) && <FailedScheduleNote job={lastJob} />}
          {hasScheduledActions && (
            <JobsTimeline
              environmentId={environmentId}
              jobs={pendingJobs}
              onCancel={handleCancel}
              isReadOnly={primary.isDisabled()}
            />
          )}
          {isDialogShown && (
            <JobDialog
              onCreate={newJob => {
                handleCreate(newJob);
                setIsDialogShown(false);
              }}
              onCancel={() => {
                setIsDialogShown(false);
              }}
            />
          )}
        </>
      )}
    </ErrorHandler>
  );
}

const CommandPropType = PropTypes.shape({
  label: PropTypes.string,
  targetStateId: PropTypes.string,
  execute: PropTypes.func.isRequired,
  isAvailable: PropTypes.func.isRequired,
  isDisabled: PropTypes.func.isRequired,
  inProgress: PropTypes.func.isRequired
});

JobWidget.propTypes = {
  spaceId: PropTypes.string.isRequired,
  environmentId: PropTypes.string.isRequired,
  userId: PropTypes.string.isRequired,
  entity: PropTypes.object.isRequired,
  status: PropTypes.string,
  isSaving: PropTypes.bool.isRequired,
  updatedAt: PropTypes.string,
  revert: CommandPropType,
  primary: CommandPropType,
  secondary: PropTypes.arrayOf(CommandPropType.isRequired).isRequired
};
