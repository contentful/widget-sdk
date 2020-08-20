import React from 'react';
import { sortBy } from 'lodash';
import { render, cleanup } from '@testing-library/react';
import { ScheduleTimeline } from './ScheduleTimeline';
import { scheduledActions, scheduledActionsForAssets } from './__fixtures__';
import { formatDateAndTime } from 'app/ScheduledActions/FormattedDateAndTime';

const getDefaultProps = (overrides) => ({
  onScheduledActionCancel: jest.fn(),
  readOnlyScheduledActions: false,
  pendingScheduledActions: [],
  isMasterEnvironment: false,
  ...overrides,
});

describe('ScheduleTimeline', () => {
  afterEach(cleanup);

  it('should render nothing if no scheduled actions or releases were given', () => {
    const props = getDefaultProps();
    const { container } = render(<ScheduleTimeline {...props} />);

    expect(container.innerHTML).toBe('');
  });

  it('should render scheduled actions cards in ascending order', () => {
    const props = getDefaultProps({
      pendingScheduledActions: scheduledActions,
    });
    const { getAllByTestId } = render(<ScheduleTimeline {...props} />);

    const scheduledActionsCards = getAllByTestId('scheduled-action-card');
    const nonReleaseScheduledActions = scheduledActions.filter(
      (action) => action.entity.sys.linkType !== 'Release' && action.status === 'scheduled'
    );
    expect(scheduledActionsCards).toHaveLength(nonReleaseScheduledActions.length);

    const allDateTimes = document.querySelectorAll('time');

    expect(() => {
      allDateTimes.forEach((dateTime, i) =>
        expect(dateTime.textContent).toBe(
          formatDateAndTime(nonReleaseScheduledActions[i].scheduledFor.datetime, '')
        )
      );
    }).toThrow();

    expect(() => {
      const sortedNonReleaseScheduledActions = sortBy(
        nonReleaseScheduledActions,
        'scheduledFor.datetime'
      );
      allDateTimes.forEach((dateTime, i) =>
        expect(dateTime.textContent).toBe(
          formatDateAndTime(sortedNonReleaseScheduledActions[i].scheduledFor.datetime, '')
        )
      );
    }).not.toThrow();
  });

  it('should render scheduled actions cards for assets', () => {
    const props = getDefaultProps({
      pendingScheduledActions: scheduledActionsForAssets,
    });
    const { getAllByTestId } = render(<ScheduleTimeline {...props} />);

    const scheduledActionsCards = getAllByTestId('scheduled-action-card');
    const nonReleaseScheduledActions = scheduledActionsForAssets.filter(
      (action) => action.entity.sys.linkType !== 'Release' && action.status === 'scheduled'
    );
    expect(scheduledActionsCards).toHaveLength(nonReleaseScheduledActions.length);

    const allDateTimes = document.querySelectorAll('time');

    expect(() => {
      allDateTimes.forEach((dateTime, i) =>
        expect(dateTime.textContent).toBe(
          formatDateAndTime(nonReleaseScheduledActions[i].scheduledFor.datetime, '')
        )
      );
    }).toThrow();

    expect(() => {
      const sortedNonReleaseScheduledActions = sortBy(
        nonReleaseScheduledActions,
        'scheduledFor.datetime'
      );
      allDateTimes.forEach((dateTime, i) =>
        expect(dateTime.textContent).toBe(
          formatDateAndTime(sortedNonReleaseScheduledActions[i].scheduledFor.datetime, '')
        )
      );
    }).not.toThrow();
  });
});
