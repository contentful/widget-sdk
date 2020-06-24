import React from 'react';
import { render, wait, fireEvent } from '@testing-library/react';

import { Notification } from '@contentful/forma-36-react-components';
import { default as ScheduledActionsWidget } from './ScheduledActionsWidget';
import {
  getNotCanceledJobsForEntity,
  createJob as createJobService,
  cancelJob,
} from '../DataManagement/ScheduledActionsService';
import * as ScheduledActionsAnalytics from 'app/ScheduledActions/Analytics/ScheduledActionsAnalytics';

const commandTemplate = {
  execute: () => {},
  isAvailable: () => true,
  isDisabled: () => false,
  inProgress: () => false,
  isRestricted: () => false,
};

jest.mock('../DataManagement/ScheduledActionsService');
jest.mock('classes/EntityFieldValueSpaceContext', () => ({ entryTitle: () => 'Test' }));
jest.mock('utils/LaunchDarkly', () => ({
  getCurrentVariation: jest.fn().mockResolvedValue(false), // Reference Dialog disabled
}));
jest.mock('app/entity_editor/UnpublishedReferencesWarning', () => ({
  showUnpublishedReferencesWarning: () => Promise.resolve(true),
}));
describe('<ScheduledActionsWidget />', () => {
  beforeEach(() => {
    jest.spyOn(Notification, 'success').mockImplementation(() => {});
    jest.spyOn(Notification, 'error').mockImplementation(() => {});
  });

  const build = (props) => {
    const resultProps = {
      spaceId: 'spaceId',
      environmentId: 'enviromentId',
      isMasterEnvironment: false,
      userId: 'userId',
      isSaving: false,
      status: 'draft',
      primary: {
        ...commandTemplate,
        label: 'Publish',
        targetStateId: 'published',
      },
      revert: {
        ...commandTemplate,
        label: 'Publish',
        targetStateId: 'published',
      },
      secondary: [
        {
          ...commandTemplate,
          label: 'Archive',
          targetStateId: 'published',
        },
      ],
      entity: createEntry(),
      validator: {
        run: jest.fn().mockReturnValueOnce(true),
      },
      emitter: {
        emit: jest.fn(),
      },
      ...props,
    };

    return [render(<ScheduledActionsWidget {...resultProps} />), resultProps];
  };

  it('renders skeleton before <StatusButton />', async () => {
    getNotCanceledJobsForEntity.mockResolvedValueOnce([]);
    const [renderResult] = build({ entity: createEntry() });

    expect(renderResult.getByTestId('jobs-skeleton')).toBeInTheDocument();
    expect(renderResult.getByTestId('change-state-published')).toBeInTheDocument();
    expect(renderResult.getByTestId('change-state-published').disabled).toBe(true);

    expect(getNotCanceledJobsForEntity).toHaveBeenCalledWith(
      expect.any(Function),

      defaultEntryId(),
      defaultDefaultEnvironmentQuert()
    );

    await wait();

    expect(renderResult.queryByTestId('jobs-skeleton')).toBeNull();
    expect(renderResult.getByTestId('change-state-published').disabled).toBe(false);
    expect(renderResult.queryByTestId('failed-job-note')).toBeNull();
  });

  it('does not render scheduled publication cta if jobs fetching failed', async () => {
    getNotCanceledJobsForEntity.mockRejectedValueOnce();
    const [renderResult] = build({ entity: createEntry() });

    expect(renderResult.getByTestId('jobs-skeleton')).toBeInTheDocument();
    expect(renderResult.getByTestId('change-state-published')).toBeInTheDocument();
    expect(renderResult.getByTestId('change-state-published').disabled).toBe(true);

    expect(getNotCanceledJobsForEntity).toHaveBeenCalledWith(
      expect.any(Function),
      defaultEntryId(),
      defaultDefaultEnvironmentQuert()
    );

    await wait();

    expect(renderResult.queryByTestId('jobs-skeleton')).toBeNull();
    expect(renderResult.getByTestId('change-state-published').disabled).toBe(false);
    expect(renderResult.queryByTestId('schedule-publication')).toBeNull();
  });

  it('does not render scheduled publication cta if publication is blocked', async () => {
    getNotCanceledJobsForEntity.mockResolvedValueOnce([]);
    const [renderResult] = build({
      entity: createEntry(),
      primary: {
        ...commandTemplate,
        label: 'Publish',
      },
      publicationBlockedReason: 'some reason',
    });

    expect(getNotCanceledJobsForEntity).toHaveBeenCalledWith(
      expect.any(Function),
      defaultEntryId(),
      defaultDefaultEnvironmentQuert()
    );

    await wait();
    fireEvent.click(renderResult.getByTestId('change-state-menu-trigger'));
    expect(
      renderResult.queryByTestId('schedule-publication').querySelector('button')
    ).toBeDisabled();
    expect(renderResult.queryByTestId('failed-job-note')).toBeNull();
  });

  it('entry is not published', async () => {
    const failedJob = createFailedJob({
      scheduledFor: {
        datetime: '2019-06-21T05:01:00.000Z',
      },
    });
    getNotCanceledJobsForEntity.mockResolvedValueOnce([failedJob]);
    const unpublishedEntry = { sys: { id: 'entryId' } };
    const [renderResult] = build(unpublishedEntry);

    await wait();
    fireEvent.click(renderResult.getByTestId('change-state-menu-trigger'));
    expect(renderResult.getByTestId('schedule-publication')).toBeInTheDocument();
    expect(renderResult.getByTestId('failed-job-note')).toBeInTheDocument();
  });

  it('entry is published but publication date is before last failed job', async () => {
    const failedJob = createFailedJob({
      scheduledFor: {
        datetime: '2019-06-21T05:01:00.000Z',
      },
    });
    getNotCanceledJobsForEntity.mockResolvedValueOnce([failedJob]);
    const publishedEntry = { sys: { id: 'entryId', publishedAt: '2019-06-21T05:00:00.000Z' } };
    const [renderResult] = build(publishedEntry);

    await wait();
    fireEvent.click(renderResult.getByTestId('change-state-menu-trigger'));
    expect(renderResult.getByTestId('schedule-publication')).toBeInTheDocument();
    expect(renderResult.getByTestId('failed-job-note')).toBeInTheDocument();
  });

  it('does not render the failed note for a failed unpublish job', async () => {
    const failedJob = createFailedJob({
      action: 'unpublish',
      scheduledFor: {
        datetime: '2019-06-21T05:01:00.000Z',
      },
    });
    getNotCanceledJobsForEntity.mockResolvedValueOnce([failedJob]);
    const publishedEntry = { sys: { id: 'entryId', publishedAt: '2019-06-21T05:00:00.000Z' } };
    const [renderResult] = build(publishedEntry);

    await wait();
    fireEvent.click(renderResult.getByTestId('change-state-menu-trigger'));
    expect(renderResult.getByTestId('schedule-publication')).toBeInTheDocument();
    expect(renderResult.queryByTestId('failed-job-note')).toBeNull();
  });

  it('does not rerender if publishedAt date is the same', async () => {
    getNotCanceledJobsForEntity.mockResolvedValueOnce([createPendingJob()]);
    const publishedEntry = createEntry({ sys: { publishedAt: '2019-06-21T05:00:00.000Z' } });
    const [renderResult, props] = build({ entity: publishedEntry });

    await wait();

    const publishedEntryWithSameDate = createEntry({
      sys: { publishedAt: '2019-06-21T05:00:00.000Z' },
    });
    renderResult.rerender(
      <ScheduledActionsWidget {...props} entity={publishedEntryWithSameDate} />
    );
    await wait();

    expect(getNotCanceledJobsForEntity).toHaveBeenCalledTimes(1);
  });

  it('rerenders if publishedAt date changed', async () => {
    getNotCanceledJobsForEntity.mockResolvedValueOnce([createPendingJob()]);
    const publishedEntry = createEntry({ sys: { publishedAt: '2019-06-21T05:00:00.000Z' } });
    const [renderResult, props] = build({ entity: publishedEntry });

    await wait();

    getNotCanceledJobsForEntity.mockResolvedValueOnce([createPendingJob()]);
    const newPublishedEntry = createEntry({ sys: { publishedAt: '2019-06-21T06:00:00.000Z' } });
    renderResult.rerender(<ScheduledActionsWidget {...props} entity={newPublishedEntry} />);
    await wait();

    expect(getNotCanceledJobsForEntity).toHaveBeenCalledTimes(2);
  });

  it('shows toast when entry was successfully published on schedule', async () => {
    getNotCanceledJobsForEntity.mockResolvedValueOnce([createPendingJob()]);
    const publishedEntry = createEntry({ sys: { publishedAt: '2019-06-21T05:00:00.000Z' } });
    const [renderResult, props] = build({ entity: publishedEntry });

    await wait();

    getNotCanceledJobsForEntity.mockResolvedValueOnce([createDoneJob()]);
    const newPublishedEntry = createEntry({ sys: { publishedAt: '2019-06-21T06:00:00.000Z' } });
    renderResult.rerender(<ScheduledActionsWidget {...props} entity={newPublishedEntry} />);
    await wait();

    expect(getNotCanceledJobsForEntity).toHaveBeenCalledTimes(2);
    expect(Notification.success).toHaveBeenCalledWith('Entry was successfully published.');
  });

  it('creates the job', async () => {
    const job = createPendingJob();
    const createJobSpy = jest.spyOn(ScheduledActionsAnalytics, 'createJob');
    const defaultTimezone = 'Africa/Abidjan';

    createJobService.mockResolvedValueOnce(job);
    getNotCanceledJobsForEntity.mockResolvedValueOnce([]);

    const notPublishedEntry = createEntry();
    const [renderResult] = build({ entity: notPublishedEntry });
    await wait();
    fireEvent.click(renderResult.getByTestId('change-state-menu-trigger'));
    fireEvent.click(renderResult.getByText('Set Schedule'));
    await wait();
    fireEvent.click(renderResult.getByTestId('schedule-publication'));
    await wait();

    expect(createJobSpy).toHaveBeenCalledTimes(1);
    expect(createJobSpy).toHaveBeenCalledWith(job, defaultTimezone);
    expect(Notification.success).toHaveBeenCalledWith('Test was scheduled successfully');
  });

  it('shows an error toast if job creation failed', async () => {
    createJobService.mockRejectedValueOnce(new Error());
    getNotCanceledJobsForEntity.mockResolvedValueOnce([]);

    const notPublishedEntry = { sys: { id: 'entryId' } };
    const [renderResult] = build({ entity: notPublishedEntry });
    await wait();

    fireEvent.click(renderResult.getByTestId('change-state-menu-trigger'));
    fireEvent.click(renderResult.getByText('Set Schedule'));
    await wait();
    fireEvent.click(renderResult.getByTestId('schedule-publication'));
    await wait();

    expect(Notification.error).toHaveBeenCalledWith('Test failed to schedule');
  });

  it('cancels the job', async () => {
    const job = createPendingJob();
    const cancelJobSpy = jest.spyOn(ScheduledActionsAnalytics, 'cancelJob');

    cancelJob.mockResolvedValueOnce();
    getNotCanceledJobsForEntity.mockResolvedValueOnce([job]);
    const publishedEntry = createEntry({ sys: { publishedAt: '2019-06-21T05:00:00.000Z' } });
    const [renderResult] = build({ entity: publishedEntry });
    await wait();

    fireEvent.click(renderResult.getByTestId('cancel-job-ddl'));
    fireEvent.click(renderResult.getByText('Cancel Schedule'));
    fireEvent.click(renderResult.getByTestId('confirm-job-cancellation'));
    await wait();

    expect(cancelJobSpy).toHaveBeenCalledTimes(1);
    expect(cancelJobSpy).toHaveBeenCalledWith(job);
  });
});

function defaultEntryId() {
  return 'entryId';
}

function defaultDefaultEnvironmentQuert() {
  return { 'environment.sys.id': 'enviromentId' };
}

function createJob(job = {}) {
  return {
    action: 'publish',
    scheduledFor: {
      datetime: '2019-06-21T05:01:00.000Z',
    },
    ...job,
    sys: {
      id: '1',
      ...job.sys,
    },
  };
}

function createPendingJob(job = {}) {
  return createJob({
    ...job,
    entity: { sys: { id: 'id' } },
    sys: { ...job.sys, status: 'scheduled' },
  });
}

function createFailedJob(job = {}) {
  return createJob({ ...job, sys: { ...job.sys, status: 'failed' } });
}

function createDoneJob(job = {}) {
  return createJob({ ...job, sys: { ...job.sys, status: 'succeeded' } });
}

function createEntry(entry = {}) {
  return {
    ...entry,
    sys: {
      id: defaultEntryId(),
      ...entry.sys,
    },
  };
}
