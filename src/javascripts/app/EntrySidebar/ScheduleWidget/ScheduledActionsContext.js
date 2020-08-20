import React, { createContext, useContext, useState, useCallback, useEffect, useMemo } from 'react';
import PropTypes from 'prop-types';
import { createJob, cancelJob } from 'app/ScheduledActions/DataManagement/ScheduledActionsService';
import { getPendingScheduledActions } from 'app/ScheduledActions/DataManagement/ScheduledActionsRepo';
import { uniqBy, sortBy } from 'lodash';
import { createSpaceEndpoint } from 'data/EndpointFactory';
import { create as createDto } from 'app/ScheduledActions/EntrySidebarWidget/ScheduledActionsFactory';
import {
  createJob as trackActionScheduled,
  cancelJob as trackActionCancelled,
} from 'app/ScheduledActions/Analytics/ScheduledActionsAnalytics';
import { getCurrentSpaceFeature, FEATURES } from 'data/CMA/ProductCatalog';

const ScheduledActionsContext = createContext();

const useScheduledActionsApi = ({ spaceId, environmentId, isMasterEnvironment }) => {
  const [pendingScheduledActions, setPendingScheduledActions] = useState([]);
  const [isScheduledActionsFeatureEnabled, setFeatureEnabled] = useState(false);
  const spaceEndpoint = useMemo(() => createSpaceEndpoint(spaceId, environmentId), [
    spaceId,
    environmentId,
  ]);

  useEffect(() => {
    const checkFeatureFlag = async () => {
      const scheduledPublishingEnabled = await getCurrentSpaceFeature(
        FEATURES.SCHEDULED_PUBLISHING,
        false
      );
      setFeatureEnabled(scheduledPublishingEnabled);
    };

    checkFeatureFlag();
  }, []);

  // TODO: think of a way to paginate
  const fetchScheduledActions = useCallback(async () => {
    const batch = await getPendingScheduledActions();
    setPendingScheduledActions(uniqBy(batch, 'sys.id'));
    return batch;
  }, []);

  const createScheduledAction = useCallback(
    async ({ scheduledAt, action, entityId, entityType, timezone }) => {
      const scheduledAction = await createJob(
        spaceEndpoint,
        createDto({
          environmentId,
          entityId,
          action,
          linkType: entityType,
          scheduledAt,
        }),
        { 'environment.sys.id': environmentId }
      );

      trackActionScheduled(scheduledAction, timezone);
      setPendingScheduledActions((scheduledActions) =>
        sortBy([scheduledAction, ...scheduledActions], 'scheduledFor.datetime')
      );
      return scheduledAction;
    },
    [environmentId, spaceEndpoint]
  );

  const cancelScheduledAction = useCallback(
    async (scheduledActionId) => {
      await cancelJob(spaceEndpoint, scheduledActionId, {
        'environment.sys.id': environmentId,
      });

      const cancelledAction = pendingScheduledActions.find(
        (action) => action?.sys.id === scheduledActionId
      );
      trackActionCancelled(cancelledAction);
      setPendingScheduledActions((scheduledActions) =>
        scheduledActions.filter((scheduledAction) => scheduledAction.sys.id !== scheduledActionId)
      );
      return cancelledAction;
    },
    [environmentId, spaceEndpoint, pendingScheduledActions]
  );

  return {
    isScheduledActionsFeatureEnabled,
    spaceId,
    environmentId,
    isMasterEnvironment,
    pendingScheduledActions,
    createScheduledAction,
    cancelScheduledAction,
    fetchScheduledActions,
  };
};

const ScheduledActionsContextProvider = ({
  spaceId,
  environmentId,
  isMasterEnvironment,
  children,
}) => {
  const scheduledActionsApi = useScheduledActionsApi({
    spaceId,
    environmentId,
    isMasterEnvironment,
  });

  return (
    <ScheduledActionsContext.Provider value={scheduledActionsApi}>
      {children}
    </ScheduledActionsContext.Provider>
  );
};

ScheduledActionsContextProvider.propTypes = {
  spaceId: PropTypes.string.isRequired,
  environmentId: PropTypes.string.isRequired,
  isMasterEnvironment: PropTypes.bool.isRequired,
};

const useScheduledActions = () => useContext(ScheduledActionsContext);

export { ScheduledActionsContext, ScheduledActionsContextProvider, useScheduledActions };
