import React, { useCallback, useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import moment from 'moment';
import { css } from 'emotion';
import ErrorHandler from 'components/shared/ErrorHandlerComponent.es6';
import CommandPropType from 'app/entity_editor/CommandPropType.es6';

import {
  SkeletonContainer,
  SkeletonBodyText,
  Note,
  TextLink,
  Notification
} from '@contentful/forma-36-react-components';
import tokens from '@contentful/forma-36-tokens';

import StatusWidget from './StatusWidget.es6';
import JobDialog from './JobDialog/index.es6';

import * as EndpointFactory from 'data/EndpointFactory.es6';

import { useAsyncFn } from 'app/common/hooks/useAsync.es6';
import usePrevious from 'app/common/hooks/usePrevious.es6';

import * as logger from 'services/logger.es6';

import { getModule } from 'NgRegistry.es6';
const spaceContext = getModule('spaceContext');

import JobsTimeline from './JobsTimeline/index.es6';

import * as JobsService from '../DataManagement/JobsService.es6';
import { create as createDto } from './JobsFactory.es6';
import FailedScheduleNote from './FailedScheduleNote/index.es6';
import {
  createJob as trackCreatedJob,
  cancelJob as trackCancelledJob
} from './../Analytics/JobsAnalytics.es6';

import { showUnpublishedReferencesWarning } from 'app/entity_editor/UnpublishedReferencesWarning/index.es6';

const styles = {
  jobsSkeleton: css({
    maxHeight: '40px',
    marginTop: tokens.spacingM
  }),
  warningNote: css({
    marginTop: tokens.spacingM
  })
};

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
  isMasterEnvironment,
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
  const [isCreatingJob, setIsCreatingJob] = useState(false);
  const publishedAt = getPublishedAt(entity);
  const entryTitle = spaceContext.entryTitle({
    getContentTypeId: () => entity.sys.contentType.sys.id,
    data: entity
  });
  const [{ isLoading, error }, fetchJobs] = useAsyncFn(
    useCallback(async () => {
      const jobCollection = await JobsService.getNotCanceledJobsForEntity(
        EndpointFactory.createSpaceEndpoint(spaceId, environmentId),
        entity.sys.id
      );
      setJobs(jobCollection);

      return jobCollection;
    }, [spaceId, environmentId, entity.sys.id]),
    true
  );

  useEffect(() => {
    fetchJobs();
  }, [fetchJobs, publishedAt]);

  const createJob = async scheduledAt => {
    try {
      const job = await JobsService.createJob(
        EndpointFactory.createSpaceEndpoint(spaceId, environmentId),
        createDto({
          spaceId,
          environmentId,
          userId,
          entityId: entity.sys.id,
          action: 'publish',
          scheduledAt
        })
      );
      return job;
    } catch (error) {
      Notification.error(`${entryTitle} failed to schedule`);
      logger.logError(error, `Entry failed to schedule`);
      setIsCreatingJob(false);
    }
  };

  const handleCreate = async ({ scheduledAt }) => {
    setIsCreatingJob(true);
    const job = await createJob(scheduledAt);
    if (job && job.sys) {
      Notification.success(`${entryTitle} was scheduled successfully`);
      setIsDialogShown(false);
      trackCreatedJob({
        jobId: job.sys.id,
        scheduledAt: job.scheduledAt
      });
      setJobs([job, ...jobs]);
    }
  };

  const handleCancel = jobId => {
    JobsService.cancelJob(EndpointFactory.createSpaceEndpoint(spaceId, environmentId), jobId).then(
      () => {
        trackCancelledJob({ jobId });
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
      <StatusWidget
        status={status}
        spaceId={spaceId}
        environmentId={environmentId}
        primary={primary}
        entity={entity}
        secondary={secondary}
        revert={revert}
        isSaving={isSaving}
        updatedAt={updatedAt}
        onScheduledPublishClick={async () => {
          const isConfirmed = await showUnpublishedReferencesWarning({
            entity,
            spaceId,
            environmentId
          });
          if (isConfirmed) {
            setIsDialogShown(true);
          }
        }}
        isScheduledPublishDisabled={Boolean(error)}
        isDisabled={hasScheduledActions || isLoading}
      />
      {isLoading && (
        <SkeletonContainer data-test-id="jobs-skeleton" className={styles.jobsSkeleton}>
          <SkeletonBodyText numberOfLines={2} />
        </SkeletonContainer>
      )}
      {error && (
        <Note noteType="warning" className={styles.warningNote}>
          We were unable to load the schedule for this entry.{' '}
          <TextLink onClick={() => fetchJobs()}>Please refresh.</TextLink>
        </Note>
      )}
      {!isLoading && !error && (
        <>
          {shouldShowErrorNote(lastJob, entity) && <FailedScheduleNote job={lastJob} />}
          {hasScheduledActions && (
            <JobsTimeline
              isMasterEnvironment={isMasterEnvironment}
              jobs={pendingJobs}
              onCancel={handleCancel}
              isReadOnly={primary.isDisabled()}
            />
          )}
          {isDialogShown && (
            <JobDialog
              onCreate={newJob => {
                handleCreate(newJob);
              }}
              onCancel={() => {
                setIsDialogShown(false);
              }}
              isSubmitting={isCreatingJob}
            />
          )}
        </>
      )}
    </ErrorHandler>
  );
}

JobWidget.propTypes = {
  spaceId: PropTypes.string.isRequired,
  environmentId: PropTypes.string.isRequired,
  isMasterEnvironment: PropTypes.bool.isRequired,
  userId: PropTypes.string.isRequired,
  entity: PropTypes.object.isRequired,
  status: PropTypes.string,
  isSaving: PropTypes.bool.isRequired,
  updatedAt: PropTypes.string,
  revert: CommandPropType,
  primary: CommandPropType,
  secondary: PropTypes.arrayOf(CommandPropType.isRequired).isRequired
};
