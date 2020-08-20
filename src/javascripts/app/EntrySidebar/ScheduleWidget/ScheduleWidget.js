import React, { useEffect, useCallback, useState, useMemo } from 'react';
import tokens from '@contentful/forma-36-tokens';
import moment from 'moment';
import { css } from 'emotion';
import { useAsyncFn } from 'core/hooks';
import pluralize from 'pluralize';
import PropTypes from 'prop-types';
import SidebarEventTypes from 'app/EntrySidebar/SidebarEventTypes.js';
import {
  Notification,
  SkeletonContainer,
  SkeletonBodyText,
  Note,
  TextLink,
} from '@contentful/forma-36-react-components';
import * as logger from 'services/logger';
import EntrySidebarWidget from '../EntrySidebarWidget';
import { ScheduleTimeline } from './ScheduleTimeline';
import ScheduledActionModal from 'app/ScheduledActions/EntrySidebarWidget/ScheduledActionDialog/ScheduledActionModal';
import { ScheduleWidgetDialogMenu } from './ScheduleWidgetDialogMenu';
import { useScheduledActions } from './ScheduledActionsContext';
import { scheduledActions } from './__fixtures__';
import { ScheduledActionsConstants } from './constants';

const styles = {
  jobsSkeleton: css({
    maxHeight: '40px',
    marginTop: tokens.spacingM,
  }),
  warningNote: css({
    marginTop: tokens.spacingM,
  }),
};

function getPublishedAt(entity) {
  // HACK: sys.publishedAt from the api and sharejs can be different
  // therefore we cut precision to reduce number of false positives
  if (entity.sys.publishedAt) {
    return moment(entity.sys.publishedAt).milliseconds(0).toISOString();
  }
}

const ScheduleWidget = ({
  emitter,
  entityInfo,
  entity,
  entityTitle,
  isMasterEnvironment,
  readOnlyScheduledActions,
  spaceId,
  environmentId,
  validator,
}) => {
  const [isCreatingScheduledAction, setIsCreatingScheduledAction] = useState(false);
  const [mostRecentlyScheduledAction, setMostRecentlyScheduledAction] = useState();
  const publishedAt = getPublishedAt(entity);
  const [dialogState, setDialogState] = useState({
    isScheduleEntryDialogShown: false,
  });

  const {
    isScheduledActionsFeatureEnabled,
    pendingScheduledActions,
    cancelScheduledAction,
    createScheduledAction,
    fetchScheduledActions,
  } = useScheduledActions();

  const toggleScheduledActionsDialog = useCallback(
    () =>
      setDialogState((dialogState) => ({
        ...dialogState,
        isScheduleEntryDialogShown: !dialogState.isScheduleEntryDialogShown,
      })),
    []
  );

  const maybeBlockTaskCreation = useCallback(
    (pendingScheduledActions) => {
      emitter.emit(SidebarEventTypes.SET_TASK_CREATION_BLOCKING, {
        blocked: !!pendingScheduledActions.length,
      });
    },
    [emitter]
  );

  const [{ isLoading, error }, fetchAllScheduledActions] = useAsyncFn(
    useCallback(async () => {
      const batchOfScheduledActions = await fetchScheduledActions();
      maybeBlockTaskCreation(batchOfScheduledActions);
      return batchOfScheduledActions;
    }, [fetchScheduledActions, maybeBlockTaskCreation]),
    isScheduledActionsFeatureEnabled
  );

  useEffect(() => {
    if (isScheduledActionsFeatureEnabled) {
      fetchAllScheduledActions();
    }
  }, [
    entityInfo,
    entity.sys.id,
    fetchAllScheduledActions,
    isScheduledActionsFeatureEnabled,
    fetchScheduledActions,
    maybeBlockTaskCreation,
  ]);

  // this useEffect handles the case, when the scheduled action was executed
  // in that case we need to re-fetch the actions to make sure that we filter out one that was executed
  useEffect(() => {
    if (isScheduledActionsFeatureEnabled && scheduledActions.length) {
      fetchAllScheduledActions();
    }
  }, [publishedAt, fetchAllScheduledActions, isScheduledActionsFeatureEnabled]);

  const handleSchedule = async ({ scheduledAt, action }, timezone) => {
    setIsCreatingScheduledAction(true);
    try {
      const scheduledAction = await createScheduledAction({
        scheduledAt,
        action,
        entityId: entity.sys.id,
        entityType: entity.sys.type,
        timezone,
      });
      if (scheduledAction && scheduledAction.sys) {
        maybeBlockTaskCreation([scheduledAction, ...pendingScheduledActions]);
        setMostRecentlyScheduledAction(scheduledAction);
        toggleScheduledActionsDialog(false);
        Notification.success(`${entityTitle} was scheduled successfully`);
      }
    } catch (error) {
      if (400 === error.status) {
        Notification.error(
          `Unable to schedule ${entityTitle}. There is a limit of ${
            ScheduledActionsConstants.SCHEDULED_ACTIONS_LIMIT
          } scheduled ${pluralize.plural(entity.sys.type.toLowerCase())} at any one time.`
        );
      } else {
        Notification.error(`${entityTitle} failed to schedule`);
      }
      logger.logError(`${entity.sys.type} failed to schedule`, {
        error,
        message: error.message,
      });
    } finally {
      setIsCreatingScheduledAction(false);
    }
  };

  const cancelSchedule = async (actionId) => {
    try {
      await cancelScheduledAction(actionId);
      maybeBlockTaskCreation(
        pendingScheduledActions.filter((action) => action.sys.id !== actionId)
      );
      Notification.success('Schedule canceled');
    } catch (error) {
      Notification.error('Failed to cancel scheduled action');
    }
  };

  const pendingEntityScheduledActions = useMemo(
    () => pendingScheduledActions.filter((action) => action.entity.sys.linkType !== 'Release'),
    [pendingScheduledActions]
  );
  const hasPendingAction = Boolean(pendingEntityScheduledActions.length);

  if (!isScheduledActionsFeatureEnabled) {
    return null;
  }

  if (isLoading) {
    return (
      <EntrySidebarWidget title="Schedule" testId="sidebar-schedules-timeline-section">
        <SkeletonContainer testId="scheduled-actions-skeleton" className={styles.jobsSkeleton}>
          <SkeletonBodyText numberOfLines={2} />
        </SkeletonContainer>
      </EntrySidebarWidget>
    );
  }

  if (error) {
    return (
      <EntrySidebarWidget title="Schedule" testId="sidebar-schedules-timeline-section">
        <Note testId="scheduled-actions-error" noteType="warning" className={styles.warningNote}>
          We were unable to load the schedule for this entity.{' '}
          <TextLink
            onClick={() => {
              fetchAllScheduledActions(entity.sys.id);
            }}>
            Please refresh.
          </TextLink>
        </Note>
      </EntrySidebarWidget>
    );
  }

  return (
    <EntrySidebarWidget title="Schedule" testId="sidebar-schedules-timeline-section">
      <ScheduleTimeline
        onScheduledActionCancel={cancelSchedule}
        readOnlyScheduledActions={readOnlyScheduledActions}
        pendingScheduledActions={pendingScheduledActions}
        isMasterEnvironment={isMasterEnvironment}
      />
      <ScheduleWidgetDialogMenu
        entity={entity}
        hasPendingAction={hasPendingAction}
        toggleScheduledActionsDialog={toggleScheduledActionsDialog}
        isScheduleEntryDialogShown={dialogState.isScheduleEntryDialogShown}
        isScheduledActionsFeatureEnabled={isScheduledActionsFeatureEnabled}
        spaceId={spaceId}
        environmentId={environmentId}
      />
      {dialogState.isScheduleEntryDialogShown && (
        <ScheduledActionModal
          isMasterEnvironment={isMasterEnvironment}
          spaceId={spaceId}
          // Please see a comment at ScheduledActionModalDialog's getSuggestedDate function to understand what is happening.
          mostRecentlyScheduledAction={
            mostRecentlyScheduledAction ||
            pendingEntityScheduledActions[pendingEntityScheduledActions.length - 1]
          }
          environmentId={environmentId}
          entity={entity}
          validator={validator}
          entryTitle={entityTitle}
          mostRecently
          pendingJobs={pendingEntityScheduledActions}
          onCreate={(newJob, timezone) => {
            handleSchedule(newJob, timezone);
          }}
          onCancel={toggleScheduledActionsDialog}
          isSubmitting={isCreatingScheduledAction}
        />
      )}
    </EntrySidebarWidget>
  );
};

ScheduleWidget.propTypes = {
  emitter: PropTypes.object.isRequired,
  entityInfo: PropTypes.object.isRequired,
  entity: PropTypes.object.isRequired,
  entityTitle: PropTypes.string.isRequired,
  isMasterEnvironment: PropTypes.bool,
  readOnlyScheduledActions: PropTypes.bool,
  spaceId: PropTypes.string.isRequired,
  environmentId: PropTypes.string.isRequired,
  validator: PropTypes.object.isRequired,
};

export { ScheduleWidget };
