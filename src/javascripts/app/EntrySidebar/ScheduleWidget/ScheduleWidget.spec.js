import React from 'react';
import { render, waitFor, findByTestId, fireEvent, act } from '@testing-library/react';
import { ScheduleWidget } from './ScheduleWidget';
import {
  ScheduledActionsContextProvider,
  ScheduledActionsContext,
} from './ScheduledActionsContext';
import { sortBy } from 'lodash';
import { createForEntry } from 'app/entity_editor/Validator';
import * as ProductCatalog from 'data/CMA/ProductCatalog';
import SidebarEventTypes from '../SidebarEventTypes';
import {
  scheduledActions,
  scheduledActionsForAssets,
  asset,
  assetInfo,
  entry,
  entryInfo,
  contentType,
} from './__fixtures__';

const emitter = {
  on: jest.fn(),
  off: jest.fn(),
  emit: jest.fn(),
};

jest.mock('ng/spaceContext', () => {
  return {
    getId: jest.fn().mockReturnValue('space-id'),
    getEnvironmentId: jest.fn().mockReturnValue('master'),
    getData: jest.fn().mockReturnValue('org-id'),
    publishedCTs: {
      getAllBare: jest.fn().mockReturnValue([]),
    },
  };
});

jest.mock('app/entity_editor/UnpublishedReferencesWarning/FetchUnpublishedReferences', () => {
  return jest.fn().mockResolvedValue([]);
});

const doc = {
  getVersion: jest.fn().mockReturnValue(1),
};

const getDefaultScheduledActionsContextProps = () => {
  return {
    spaceId: 'space-id',
    environmentId: 'master',
    isMasterEnvironment: true,
  };
};

const publishedCTs = {
  get: jest.fn().mockReturnValue(contentType),
  getAllBare: jest.fn().mockReturnValue([contentType]),
};

const validator = createForEntry(contentType, doc, publishedCTs, [
  { code: 'en-US', default: true, internalCode: 'en-US' },
]);

const getDefaultProps = (overwrites = {}) => {
  return {
    emitter,
    entityInfo: entryInfo,
    entity: entry,
    entityTitle: entry.fields[contentType.displayField]['en-US'],
    ...getDefaultScheduledActionsContextProps(),
    readOnlyScheduledActions: false,
    validator,
    ...overwrites,
  };
};

describe('ScheduleWidget', () => {
  it('should not render anything if both feature flags are disabled', () => {
    const productCatalogSpy = jest
      .spyOn(ProductCatalog, 'getCurrentSpaceFeature')
      .mockResolvedValue(false);
    const { container } = render(
      <ScheduledActionsContextProvider {...getDefaultScheduledActionsContextProps()}>
        <ScheduleWidget {...getDefaultProps()} />
      </ScheduledActionsContextProvider>
    );

    waitFor(() => {
      expect(productCatalogSpy).toHaveBeenCalledWith(
        ProductCatalog.FEATURES.SCHEDULED_PUBLISHING,
        false
      );
    });

    expect(container.innerHTML).toBe('');
  });

  describe('scheduledActions feature flag enabled', () => {
    const getDefaultScheduledActionsApi = (overrides) => {
      return {
        isScheduledActionsFeatureEnabled: true,
        ...getDefaultScheduledActionsContextProps(),
        pendingScheduledActions: [],
        createScheduledAction: jest.fn(),
        cancelScheduledAction: jest.fn(),
        fetchScheduledActions: jest.fn().mockResolvedValue([]),
        ...overrides,
      };
    };

    it('should render the option to schedule the scheduledAction', async () => {
      const scheduledActionsApi = getDefaultScheduledActionsApi();
      const componentProps = getDefaultProps();
      const { getByText, getByTestId } = render(
        <ScheduledActionsContext.Provider value={scheduledActionsApi}>
          <ScheduleWidget {...componentProps} />
        </ScheduledActionsContext.Provider>
      );

      await waitFor(() => expect(getByTestId('schedule-entity-button')).toBeDefined());
      expect(getByTestId('schedule-entity-button').textContent).toBe('Schedule entry');
      expect(getByText('Schedule')).toBeDefined();
      expect(scheduledActionsApi.fetchScheduledActions).toHaveBeenCalled();
    });

    it('renders skeleton when is loading', async () => {
      const fetchScheduledActions = jest.fn(
        () => new Promise((resolve) => setTimeout(() => resolve([]), 1000))
      );
      const scheduledActionsApi = getDefaultScheduledActionsApi({ fetchScheduledActions });
      const componentProps = getDefaultProps();
      const { findByTestId } = render(
        <ScheduledActionsContext.Provider value={scheduledActionsApi}>
          <ScheduleWidget {...componentProps} />
        </ScheduledActionsContext.Provider>
      );

      await findByTestId('scheduled-actions-skeleton');
      expect(scheduledActionsApi.fetchScheduledActions).toHaveBeenCalled();
    });

    it('renders a warning if jobs fetching failed', async () => {
      const error = new Error('Omg aw lawd, oh shoot');
      const fetchScheduledActions = jest.fn(
        () => new Promise((_, reject) => setTimeout(() => reject(error), 500))
      );
      const scheduledActionsApi = getDefaultScheduledActionsApi({ fetchScheduledActions });
      const componentProps = getDefaultProps();
      const { findByTestId } = render(
        <ScheduledActionsContext.Provider value={scheduledActionsApi}>
          <ScheduleWidget {...componentProps} />
        </ScheduledActionsContext.Provider>
      );

      await findByTestId('scheduled-actions-error');
      expect(scheduledActionsApi.fetchScheduledActions).toHaveBeenCalled();
    });

    it('renders fetched scheduled actions in the timeline', async () => {
      const scheduledActionsApi = getDefaultScheduledActionsApi({
        pendingScheduledActions: scheduledActions,
        fetchScheduledActions: jest.fn().mockResolvedValue(scheduledActions),
      });
      const componentProps = getDefaultProps();
      const { findAllByTestId } = render(
        <ScheduledActionsContext.Provider value={scheduledActionsApi}>
          <ScheduleWidget {...componentProps} />
        </ScheduledActionsContext.Provider>
      );

      const scheduledActionCards = await findAllByTestId('scheduled-action-card');
      const pendingEntityScheduledActions = sortBy(
        scheduledActions.filter(
          (action) => action.entity.sys.linkType !== 'Release' && action.status === 'scheduled'
        ),
        'scheduledFor.datetime'
      );
      expect(scheduledActionCards).toHaveLength(pendingEntityScheduledActions.length);
      expect(componentProps.emitter.emit).toHaveBeenCalledWith(
        SidebarEventTypes.SET_TASK_CREATION_BLOCKING,
        {
          blocked: true,
        }
      );
      expect((await findByTestId(scheduledActionCards[0], 'scheduled-action')).textContent).toBe(
        pendingEntityScheduledActions[0].action
      );
      expect((await findByTestId(scheduledActionCards[1], 'scheduled-action')).textContent).toBe(
        pendingEntityScheduledActions[1].action
      );
    });

    it('renders fetched scheduled actions for assets', async () => {
      const scheduledActionsApi = getDefaultScheduledActionsApi({
        pendingScheduledActions: scheduledActionsForAssets,
        fetchScheduledActions: jest.fn().mockResolvedValue(scheduledActionsForAssets),
      });
      const componentProps = getDefaultProps({
        entity: asset,
        entityInfo: assetInfo,
      });
      const { findAllByTestId, getByTestId } = render(
        <ScheduledActionsContext.Provider value={scheduledActionsApi}>
          <ScheduleWidget {...componentProps} />
        </ScheduledActionsContext.Provider>
      );

      const scheduledActionCards = await findAllByTestId('scheduled-action-card');
      expect(getByTestId('schedule-entity-button').textContent).toBe('Schedule asset');
      const pendingEntityScheduledActions = sortBy(
        scheduledActions.filter(
          (action) => action.entity.sys.linkType !== 'Release' && action.status === 'scheduled'
        ),
        'scheduledFor.datetime'
      );
      expect(scheduledActionCards).toHaveLength(pendingEntityScheduledActions.length);
      expect(componentProps.emitter.emit).toHaveBeenCalledWith(
        SidebarEventTypes.SET_TASK_CREATION_BLOCKING,
        {
          blocked: true,
        }
      );
      expect((await findByTestId(scheduledActionCards[0], 'scheduled-action')).textContent).toBe(
        pendingEntityScheduledActions[0].action
      );
      expect((await findByTestId(scheduledActionCards[1], 'scheduled-action')).textContent).toBe(
        pendingEntityScheduledActions[1].action
      );
    });

    it('renders fetched scheduled actions as readonly', async () => {
      const fetchScheduledActions = jest.fn().mockResolvedValue(scheduledActions);
      const scheduledActionsApi = getDefaultScheduledActionsApi({
        fetchScheduledActions,
        pendingScheduledActions: scheduledActions,
      });
      const componentProps = getDefaultProps({ readOnlyScheduledActions: true });
      const { queryByTestId, findAllByTestId } = render(
        <ScheduledActionsContext.Provider value={scheduledActionsApi}>
          <ScheduleWidget {...componentProps} />
        </ScheduledActionsContext.Provider>
      );

      const scheduledActionCards = await findAllByTestId('scheduled-action-card');
      const pendingEntityScheduledActions = scheduledActions.filter(
        (action) => action.entity.sys.linkType !== 'Release' && action.status === 'scheduled'
      );
      expect(scheduledActionCards).toHaveLength(pendingEntityScheduledActions.length);
      expect(queryByTestId('cancel-scheduled-action-ddl')).toBeNull();
    });

    it('cancels the schedule', async () => {
      const fetchScheduledActions = jest.fn().mockResolvedValue(scheduledActions);
      const scheduledActionsApi = getDefaultScheduledActionsApi({
        fetchScheduledActions,
        pendingScheduledActions: scheduledActions,
      });
      const componentProps = getDefaultProps();
      const { getByText, getByTestId, findAllByTestId } = render(
        <ScheduledActionsContext.Provider value={scheduledActionsApi}>
          <ScheduleWidget {...componentProps} />
        </ScheduledActionsContext.Provider>
      );

      const scheduledActionCards = await findAllByTestId('scheduled-action-card');
      const pendingEntityScheduledActions = scheduledActions.filter(
        (action) => action.entity.sys.linkType !== 'Release' && action.status === 'scheduled'
      );
      expect(scheduledActionCards).toHaveLength(pendingEntityScheduledActions.length);

      const firstCardDropdown = await findByTestId(
        scheduledActionCards[0],
        'cancel-scheduled-action-ddl'
      );

      act(() => {
        fireEvent.click(firstCardDropdown);
      });

      const firstCardCancelButton = getByText('Cancel schedule');
      act(() => {
        fireEvent.click(firstCardCancelButton);
      });

      const cancelModalConfirm = await waitFor(() =>
        getByTestId('confirm-scheduled-action-cancellation')
      );
      act(() => {
        fireEvent.click(cancelModalConfirm);
      });

      await waitFor(() => expect(scheduledActionsApi.cancelScheduledAction).toHaveBeenCalled());
      expect(componentProps.emitter.emit).toHaveBeenCalledWith(
        SidebarEventTypes.SET_TASK_CREATION_BLOCKING,
        {
          blocked: true,
        }
      );
    });

    it('renders an option to schedule an action and triggers scheduled actions modal on click', async () => {
      const fetchScheduledActions = jest.fn().mockResolvedValue(scheduledActions);
      const scheduledActionsApi = getDefaultScheduledActionsApi({
        fetchScheduledActions,
        pendingScheduledActions: scheduledActions,
      });
      const componentProps = getDefaultProps();
      const { getByTestId, findAllByTestId } = render(
        <ScheduledActionsContext.Provider value={scheduledActionsApi}>
          <ScheduleWidget {...componentProps} />
        </ScheduledActionsContext.Provider>
      );

      await findAllByTestId('scheduled-action-card');
      const addScheduledAction = getByTestId('schedule-entity-button');

      act(() => {
        fireEvent.click(addScheduledAction);
      });

      await waitFor(() => getByTestId('schedule-publication-modal'));
    });

    it('should send emitter events to block tasks if some actions are scheduled', async () => {
      const modifiedScheduledActions = [
        ...scheduledActions,
        {
          sys: {
            id: 'action-id-10',
            type: 'ScheduledAction',
          },
          entity: {
            sys: {
              id: 'entity-id-10',
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
      const fetchScheduledActions = jest.fn().mockResolvedValue(modifiedScheduledActions);
      const scheduledActionsApi = getDefaultScheduledActionsApi({
        fetchScheduledActions,
        pendingScheduledActions: modifiedScheduledActions,
      });
      const componentProps = getDefaultProps();
      const { getByTestId, findAllByTestId } = render(
        <ScheduledActionsContext.Provider value={scheduledActionsApi}>
          <ScheduleWidget {...componentProps} />
        </ScheduledActionsContext.Provider>
      );

      await findAllByTestId('scheduled-action-card');
      const addScheduledAction = getByTestId('schedule-entity-button');

      act(() => {
        fireEvent.click(addScheduledAction);
      });

      await waitFor(() => getByTestId('schedule-publication-modal'));

      fireEvent.click(document.getElementById('action-publish'));
      fireEvent.click(getByTestId('schedule-publication'));

      await waitFor(() => expect(scheduledActionsApi.createScheduledAction).toHaveBeenCalled());
      expect(componentProps.emitter.emit).toHaveBeenCalledWith(
        SidebarEventTypes.SET_TASK_CREATION_BLOCKING,
        {
          blocked: true,
        }
      );
    });
  });
});
