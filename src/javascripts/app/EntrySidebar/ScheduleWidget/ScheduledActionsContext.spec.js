import { renderHook, cleanup } from '@testing-library/react-hooks';
import { ScheduledActionsContextProvider, useScheduledActions } from './ScheduledActionsContext';
import * as ProductCatalog from 'data/CMA/ProductCatalog';
import * as ScheduledActionsRepo from 'app/ScheduledActions/DataManagement/ScheduledActionsRepo';
import * as ScheduledActionsService from 'app/ScheduledActions/DataManagement/ScheduledActionsService';
import * as ScheduledActionsAnalytics from 'app/ScheduledActions/Analytics/ScheduledActionsAnalytics';
import { act } from '@testing-library/react';

const contextProviderProps = () => ({
  spaceId: 'space-id',
  environmentId: 'master',
  isMasterEnvironment: true,
});

let featureSpy;

describe('Scheduled Actions context', () => {
  beforeAll(() => {
    featureSpy = jest.spyOn(ProductCatalog, 'getCurrentSpaceFeature').mockResolvedValue(true);
  });

  afterEach(cleanup);

  afterAll(() => {
    featureSpy.mockRestore();
  });

  it('should expose the context api', async () => {
    const { result, waitForNextUpdate } = renderHook(() => useScheduledActions(), {
      wrapper: ScheduledActionsContextProvider,
      initialProps: contextProviderProps(),
    });

    await waitForNextUpdate();

    expect(featureSpy).toHaveBeenCalledWith(ProductCatalog.FEATURES.SCHEDULED_PUBLISHING, false);

    expect(result.current.isScheduledActionsFeatureEnabled).toBe(true);
    expect(result.current.spaceId).toBe(contextProviderProps().spaceId);
    expect(result.current.environmentId).toBe(contextProviderProps().environmentId);
    expect(result.current.isMasterEnvironment).toBe(contextProviderProps().isMasterEnvironment);
    expect(result.current.pendingScheduledActions).toEqual([]);
    expect(typeof result.current.createScheduledAction).toBe('function');
    expect(typeof result.current.cancelScheduledAction).toBe('function');
    expect(typeof result.current.fetchScheduledActions).toBe('function');
  });

  it('should allow to fetch scheduled actions and keep only unique values', async () => {
    const { result, waitForNextUpdate } = renderHook(() => useScheduledActions(), {
      wrapper: ScheduledActionsContextProvider,
      initialProps: contextProviderProps(),
    });

    await waitForNextUpdate();

    const scheduledActions = [
      {
        sys: {
          id: 'action-id-1',
          type: 'ScheduledAction',
        },
        entity: {
          sys: {
            linkType: 'Entry',
          },
        },
        action: 'publish',
        status: 'scheduled',
        scheduledFor: {
          datetime: new Date().toISOString(),
        },
      },
      {
        sys: {
          id: 'action-id-2',
          type: 'ScheduledAction',
        },
        entity: {
          sys: {
            linkType: 'Entry',
          },
        },
        action: 'unpublish',
        status: 'scheduled',
        scheduledFor: {
          datetime: new Date().toISOString(),
        },
      },
      {
        sys: {
          id: 'action-id-1',
          type: 'ScheduledAction',
        },
        entity: {
          sys: {
            linkType: 'Entry',
          },
        },
        action: 'publish',
        status: 'scheduled',
        scheduledFor: {
          datetime: new Date().toISOString(),
        },
      },
    ];

    jest
      .spyOn(ScheduledActionsRepo, 'getPendingScheduledActions')
      .mockResolvedValue(scheduledActions);

    act(() => {
      result.current.fetchScheduledActions();
    });

    await waitForNextUpdate();

    expect(ScheduledActionsRepo.getPendingScheduledActions).toHaveBeenCalled();
    expect(result.current.pendingScheduledActions).toEqual(scheduledActions.slice(0, 2));
  });

  it('should allow to schedule a new scheduled action and track such event', async () => {
    const { result, waitForNextUpdate } = renderHook(() => useScheduledActions(), {
      wrapper: ScheduledActionsContextProvider,
      initialProps: contextProviderProps(),
    });

    await waitForNextUpdate();

    const scheduledAction = {
      sys: {
        id: 'action-id-1',
        type: 'ScheduledAction',
      },
      entity: {
        sys: {
          id: 'entity-id',
          type: 'Link',
          linkType: 'Entry',
        },
      },
      action: 'publish',
      status: 'scheduled',
      scheduledFor: {
        datetime: new Date().toISOString(),
      },
    };

    jest.spyOn(ScheduledActionsService, 'createJob').mockResolvedValue(scheduledAction);
    jest.spyOn(ScheduledActionsAnalytics, 'createJob');

    act(() => {
      result.current.createScheduledAction({
        scheduledAt: new Date(),
        action: 'publish',
        entityId: 'entity-id',
        linkType: 'Entity',
      });
    });

    await waitForNextUpdate();

    expect(ScheduledActionsService.createJob).toHaveBeenCalled();
    expect(ScheduledActionsAnalytics.createJob).toHaveBeenCalledWith(scheduledAction, undefined);
  });

  it('should allow to cancel a scheduled action and track such event', async () => {
    const { result, waitForNextUpdate } = renderHook(() => useScheduledActions(), {
      wrapper: ScheduledActionsContextProvider,
      initialProps: contextProviderProps(),
    });

    await waitForNextUpdate();

    const scheduledAction = {
      sys: {
        id: 'action-id-1',
        type: 'ScheduledAction',
      },
      entity: {
        sys: {
          id: 'entity-id',
          type: 'Link',
          linkType: 'Entry',
        },
      },
      action: 'publish',
      status: 'scheduled',
      scheduledFor: {
        datetime: new Date().toISOString(),
      },
    };

    jest.spyOn(ScheduledActionsService, 'createJob').mockResolvedValue(scheduledAction);
    jest.spyOn(ScheduledActionsAnalytics, 'createJob');

    act(() => {
      result.current.createScheduledAction({
        scheduledAt: new Date(),
        action: 'publish',
        entityId: 'entity-id',
        linkType: 'Entity',
      });
    });

    await waitForNextUpdate();

    expect(result.current.pendingScheduledActions).toEqual([scheduledAction]);

    jest.spyOn(ScheduledActionsService, 'cancelJob').mockResolvedValue(scheduledAction);
    jest.spyOn(ScheduledActionsAnalytics, 'cancelJob');

    act(() => {
      result.current.cancelScheduledAction(scheduledAction.sys.id);
    });

    await waitForNextUpdate();

    expect(result.current.pendingScheduledActions).toEqual([]);
    expect(ScheduledActionsService.cancelJob).toHaveBeenCalled();
    expect(ScheduledActionsAnalytics.cancelJob).toHaveBeenCalled();
  });
});
