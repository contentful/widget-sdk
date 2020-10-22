import React, { useCallback, useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import * as _ from 'lodash';
import moment from 'moment';
import { css } from 'emotion';
import ErrorHandler from 'components/shared/ErrorHandlerComponent';
import CommandPropType from 'app/entity_editor/CommandPropType';
import SidebarEventTypes from 'app/EntrySidebar/SidebarEventTypes.js';
import * as EntityFieldValueSpaceContext from 'classes/EntityFieldValueSpaceContext';

import {
  SkeletonContainer,
  SkeletonBodyText,
  Note,
  TextLink,
  Notification,
} from '@contentful/forma-36-react-components';
import tokens from '@contentful/forma-36-tokens';

import StatusWidget from './StatusWidget';
import ScheduledActionDialog from './ScheduledActionDialog/ScheduledActionWidgetJobDialog';

import * as EndpointFactory from 'data/EndpointFactory';

import { useAsyncFn, usePrevious } from 'core/hooks';

import * as logger from 'services/logger';

import ScheduledActionsTimeline from './ScheduledActionsTimeline';

import * as ScheduledActionsService from '../DataManagement/ScheduledActionsService';
import { create as createDto } from './ScheduledActionsFactory';
import FailedScheduleNote from './FailedScheduleNote';
import {
  createJob as trackCreatedJob,
  cancelJob as trackCancelledJob,
} from '../Analytics/ScheduledActionsAnalytics';

import { showUnpublishedReferencesWarning } from 'app/entity_editor/UnpublishedReferencesWarning';
import { DateTime } from 'app/ScheduledActions/FormattedDateAndTime';
import localeStore from 'services/localeStore';

const styles = {
  jobsSkeleton: css({
    maxHeight: '40px',
    marginTop: tokens.spacingM,
  }),
  warningNote: css({
    marginTop: tokens.spacingM,
  }),
  marginedJobsSkeleton: css({
    maxHeight: '40px',
    marginTop: tokens.spacing2Xl,
  }),
};

function shouldShowErrorNote(lastJob, entity) {
  if (!lastJob) {
    return false;
  }

  if (lastJob.action !== 'publish') {
    return false;
  }

  if (entity.sys.publishedAt) {
    const entryPublishedAfterLastFailedJob = moment(entity.sys.publishedAt).isAfter(
      lastJob.scheduledFor.datetime
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
      prevLastJob.sys.status === 'scheduled' &&
      lastJob.sys.status === 'succeeded'
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
    return moment(entity.sys.publishedAt).milliseconds(0).toISOString();
  }
}

export default function ScheduledActionsWidget({
  spaceId,
  environmentId,
  isMasterEnvironment,
  entity,
  status,
  primary,
  secondary,
  revert,
  isSaving,
  updatedAt,
  validator,
  publicationBlockedReason,
  isStatusSwitch,
  emitter,
}) {
  const [jobs, setJobs] = useState([]);
  const [isDialogShown, setIsDialogShown] = useState(false);
  const [isCreatingJob, setIsCreatingJob] = useState(false);
  const publishedAt = getPublishedAt(entity);
  const entityType = entity.sys.type;
  const entityTitle =
    EntityFieldValueSpaceContext.entityTitle(
      {
        getType: () => entityType,
        getContentTypeId: () => entity.sys.contentType.sys.id,
        data: entity,
      },
      localeStore.getFocusedLocale().code
    ) || 'Untitled';

  const hasActiveScheduledAction = (jobs) => jobs.find((job) => job.sys.status === 'scheduled');

  function setJobsState(jobs) {
    emitter.emit(SidebarEventTypes.SET_TASK_CREATION_BLOCKING, {
      blocked: !!hasActiveScheduledAction(jobs),
    });
    setJobs(jobs);
  }

  const [{ isLoading, error }, fetchJobs] = useAsyncFn(
    useCallback(async () => {
      const jobCollection = await ScheduledActionsService.getNotCanceledJobsForEntity(
        EndpointFactory.createSpaceEndpoint(spaceId, environmentId),
        entity.sys.id,
        { 'environment.sys.id': environmentId }
      );

      setJobs(jobCollection);

      emitter.emit(SidebarEventTypes.SET_TASK_CREATION_BLOCKING, {
        blocked: !!hasActiveScheduledAction(jobCollection),
      });

      return jobCollection;
    }, [spaceId, environmentId, entity.sys.id, emitter]),
    true
  );

  useEffect(() => {
    fetchJobs();
  }, [fetchJobs, publishedAt]);

  const createJob = async ({ scheduledAt, action }) => {
    try {
      const job = await ScheduledActionsService.createJob(
        EndpointFactory.createSpaceEndpoint(spaceId, environmentId),
        createDto({
          environmentId,
          entityId: entity.sys.id,
          action: action,
          linkType: entityType,
          scheduledAt,
        }),
        { 'environment.sys.id': environmentId }
      );
      return job;
    } catch (error) {
      if (400 === error.status) {
        Notification.error(
          `Unable to schedule ${entityTitle}. There is a limit of 200 scheduled entries at any one time.`
        );
      } else {
        Notification.error(`${entityTitle} failed to schedule`);
      }
      setIsCreatingJob(false);
      logger.logError(`${entityType} failed to schedule`, {
        error,
        message: error.message,
      });
    }
  };

  const handleCreate = async ({ scheduledAt, action }, timezone) => {
    setIsCreatingJob(true);
    const job = await createJob({ scheduledAt, action });
    if (job && job.sys) {
      Notification.success(`${entityTitle} was scheduled successfully`);
      setIsCreatingJob(false);
      setIsDialogShown(false);
      trackCreatedJob(job, timezone);
      setJobsState([job, ...jobs]);
    }
  };

  const handleCancel = (jobId) => {
    ScheduledActionsService.cancelJob(
      EndpointFactory.createSpaceEndpoint(spaceId, environmentId),
      jobId,
      { 'environment.sys.id': environmentId }
    ).then(() => {
      const job = jobs.find((j) => j.sys.id === jobId);
      trackCancelledJob(job);
      setJobsState(jobs.filter((j) => j !== job));
      Notification.success('Schedule canceled');
    });
  };

  const pendingJobs = jobs.filter((job) => job.sys.status === 'scheduled');
  const hasScheduledActions = pendingJobs.length > 0;

  const lastJob = jobs[0];
  const prevLastJob = usePrevious(lastJob);
  const showToast = shouldShowSuccessToast(prevLastJob, lastJob, entity);

  useEffect(() => {
    if (showToast) {
      Notification.success(`${entityType} was successfully published.`);
    }
  }, [showToast, entityType]);

  const failedScheduleNote = (scheduledAt) => {
    return (
      <>
        Due to validation errors this {entityType.toLowerCase()} failed to {lastJob.action} on{' '}
        <DateTime date={scheduledAt} />. Please check individual fields and try your action again.
      </>
    );
  };
  return (
    <ErrorHandler>
      <StatusWidget
        status={status}
        spaceId={spaceId}
        environmentId={environmentId}
        primary={primary}
        isScheduled={hasScheduledActions}
        entity={entity}
        entryTitle={entityTitle}
        secondary={secondary}
        revert={revert}
        isSaving={isSaving}
        updatedAt={updatedAt}
        isStatusSwitch={isStatusSwitch}
        onScheduledPublishClick={async () => {
          const isConfirmed = await showUnpublishedReferencesWarning({
            entity,
            spaceId,
            environmentId,
            confirmLabel: 'Schedule anyway',
            modalTitle: `Are you sure you want to schedule this ${entityType.toLowerCase()} to publish?`,
          });

          if (isConfirmed) {
            setIsDialogShown(true);
          }
        }}
        isScheduledPublishDisabled={Boolean(error)}
        isDisabled={isLoading}
        publicationBlockedReason={publicationBlockedReason}
      />
      {isLoading && (
        <SkeletonContainer
          data-test-id="jobs-skeleton"
          className={isStatusSwitch ? styles.marginedJobsSkeleton : styles.jobsSkeleton}>
          <SkeletonBodyText numberOfLines={2} />
        </SkeletonContainer>
      )}
      {error && (
        <Note noteType="warning" className={styles.warningNote}>
          We were unable to load the schedule for this {entityType.toLowerCase()}.{' '}
          <TextLink onClick={() => fetchJobs()}>Please refresh.</TextLink>
        </Note>
      )}
      {!isLoading && !error && (
        <>
          {shouldShowErrorNote(lastJob, entity) && (
            <FailedScheduleNote job={lastJob} failedScheduleNote={failedScheduleNote} />
          )}
          {hasScheduledActions && (
            <ScheduledActionsTimeline
              isMasterEnvironment={isMasterEnvironment}
              jobs={pendingJobs}
              onCancel={handleCancel}
              isReadOnly={primary.isDisabled()}
              linkType={entityType}
            />
          )}
        </>
      )}
      {isDialogShown && (
        <ScheduledActionDialog
          isMasterEnvironment={isMasterEnvironment}
          entity={entity}
          validator={validator}
          entityTitle={entityTitle}
          pendingJobs={pendingJobs}
          onCreate={(newJob, timezone) => {
            handleCreate(newJob, timezone);
          }}
          onCancel={() => {
            setIsDialogShown(false);
          }}
          isSubmitting={isCreatingJob}
        />
      )}
    </ErrorHandler>
  );
}

ScheduledActionsWidget.propTypes = {
  spaceId: PropTypes.string.isRequired,
  environmentId: PropTypes.string.isRequired,
  isMasterEnvironment: PropTypes.bool.isRequired,
  entity: PropTypes.object.isRequired,
  status: PropTypes.string,
  isSaving: PropTypes.bool.isRequired,
  updatedAt: PropTypes.string,
  revert: CommandPropType,
  primary: CommandPropType,
  secondary: PropTypes.arrayOf(CommandPropType.isRequired).isRequired,
  validator: PropTypes.shape({
    run: PropTypes.func,
    setApiResponseErrors: PropTypes.func,
  }).isRequired,
  publicationBlockedReason: PropTypes.string,
  isStatusSwitch: PropTypes.bool,
  emitter: PropTypes.object.isRequired,
};

ScheduledActionsWidget.defaultProps = {
  isStatusSwitch: false,
};
