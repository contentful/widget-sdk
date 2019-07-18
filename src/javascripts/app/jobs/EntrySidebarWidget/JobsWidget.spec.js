import React from 'react';
import { render, cleanup, wait, fireEvent } from '@testing-library/react';
import 'jest-dom/extend-expect';

import { Notification } from '@contentful/forma-36-react-components';
import JobWidget from './JobsWidget.es6';
import {
  getNotCanceledJobsForEntity,
  createJob as createJobService,
  cancelJob
} from '../DataManagement/JobsService.es6';
import * as JobsAnalytics from 'app/jobs/Analytics/JobsAnalytics.es6';

const commandTemplate = {
  execute: () => {},
  isAvailable: () => true,
  isDisabled: () => false,
  inProgress: () => false,
  isRestricted: () => false
};

jest.mock('../DataManagement/JobsService.es6');
describe('<JobWidget />', () => {
  beforeEach(() => {
    jest.spyOn(Notification, 'success').mockImplementation(() => {});
    jest.spyOn(Notification, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    cleanup();
    jest.clearAllMocks();
  });

  const build = props => {
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
        targetStateId: 'published'
      },
      revert: {
        ...commandTemplate,
        label: 'Publish',
        targetStateId: 'published'
      },
      secondary: [
        {
          ...commandTemplate,
          label: 'Archive',
          targetStateId: 'published'
        }
      ],
      entity: createEntry(),
      ...props
    };

    return [render(<JobWidget {...resultProps} />), resultProps];
  };

  it('renders skeleton before <StatusButton />', async () => {
    getNotCanceledJobsForEntity.mockResolvedValueOnce([]);
    const [renderResult] = build({ entity: createEntry() });

    expect(renderResult.getByTestId('jobs-skeleton')).toBeInTheDocument();
    expect(renderResult.getByTestId('change-state-published')).toBeInTheDocument();
    expect(renderResult.getByTestId('change-state-published').disabled).toBe(true);

    expect(getNotCanceledJobsForEntity).toHaveBeenCalledWith(
      expect.any(Function),
      defaultEntryId()
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
      defaultEntryId()
    );

    await wait();

    expect(renderResult.queryByTestId('jobs-skeleton')).toBeNull();
    expect(renderResult.getByTestId('change-state-published').disabled).toBe(false);
    expect(renderResult.queryByTestId('schedule-publication')).toBeNull();
  });

  it('disables the status button when there is an active job', async () => {
    getNotCanceledJobsForEntity.mockResolvedValueOnce([createPendingJob()]);
    const publishedEntry = createEntry({ sys: { publishedAt: '2019-06-21T05:00:00.000Z' } });
    const [renderResult] = build({ entity: publishedEntry });
    await wait();
    expect(renderResult.getByTestId('change-state-menu-trigger')).toBeDisabled();
    expect(renderResult.getByTestId('change-state-published')).toBeDisabled();
  });

  it('does not render scheduled publication cta if primary action is not allowed', async () => {
    getNotCanceledJobsForEntity.mockResolvedValueOnce([]);
    const [renderResult] = build({
      entity: createEntry(),
      primary: {
        ...commandTemplate,
        label: 'Publish',
        targetStateId: 'published',
        isDisabled: () => true
      }
    });

    expect(getNotCanceledJobsForEntity).toHaveBeenCalledWith(
      expect.any(Function),
      defaultEntryId()
    );

    await wait();
    fireEvent.click(renderResult.getByTestId('change-state-menu-trigger'));
    expect(renderResult.queryByTestId('schedule-publication')).toBeNull();
    expect(renderResult.queryByTestId('failed-job-note')).toBeNull();
  });

  describe('renders an error note when the last job failed and', () => {
    it('entry is not published', async () => {
      const failedJob = createFailedJob({
        scheduledAt: '2019-06-21T05:01:00.000Z'
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
        scheduledAt: '2019-06-21T05:01:00.000Z'
      });
      getNotCanceledJobsForEntity.mockResolvedValueOnce([failedJob]);
      const publishedEntry = { sys: { id: 'entryId', publishedAt: '2019-06-21T05:00:00.000Z' } };
      const [renderResult] = build(publishedEntry);

      await wait();
      fireEvent.click(renderResult.getByTestId('change-state-menu-trigger'));
      expect(renderResult.getByTestId('schedule-publication')).toBeInTheDocument();
      expect(renderResult.getByTestId('failed-job-note')).toBeInTheDocument();
    });
  });

  describe('on new props', () => {
    it('does not rerender if publishedAt date is the same', async () => {
      getNotCanceledJobsForEntity.mockResolvedValueOnce([createPendingJob()]);
      const publishedEntry = createEntry({ sys: { publishedAt: '2019-06-21T05:00:00.000Z' } });
      const [renderResult, props] = build({ entity: publishedEntry });

      await wait();

      const publishedEntryWithSameDate = createEntry({
        sys: { publishedAt: '2019-06-21T05:00:00.000Z' }
      });
      renderResult.rerender(<JobWidget {...props} entity={publishedEntryWithSameDate} />);
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
      renderResult.rerender(<JobWidget {...props} entity={newPublishedEntry} />);
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
      renderResult.rerender(<JobWidget {...props} entity={newPublishedEntry} />);
      await wait();

      expect(getNotCanceledJobsForEntity).toHaveBeenCalledTimes(2);
      expect(Notification.success).toHaveBeenCalledWith('Entry was successfully published.');
    });
  });

  describe('analytics', () => {
    let job;

    beforeEach(() => {
      job = createPendingJob();
    });

    it('creates the job', async () => {
      const createJobSpy = jest.spyOn(JobsAnalytics, 'createJob');

      createJobService.mockResolvedValueOnce(job);
      getNotCanceledJobsForEntity.mockResolvedValueOnce([]);

      const notPublishedEntry = { sys: { id: 'entryId' } };
      const [renderResult] = build(notPublishedEntry);
      await wait();

      fireEvent.click(renderResult.getByTestId('change-state-menu-trigger'));
      fireEvent.click(renderResult.getByText('Schedule publication'));
      fireEvent.click(renderResult.getByTestId('schedule-publication'));
      await wait();

      expect(createJobSpy).toHaveBeenCalledTimes(1);
      expect(createJobSpy).toHaveBeenCalledWith({
        jobId: job.sys.id,
        scheduledAt: job.scheduledAt
      });
    });

    it('cancels the job', async () => {
      const cancelJobSpy = jest.spyOn(JobsAnalytics, 'cancelJob');

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
      expect(cancelJobSpy).toHaveBeenCalledWith({
        jobId: job.sys.id
      });
    });
  });
});

function defaultEntryId() {
  return 'entryId';
}

function createJob(job = {}) {
  return {
    action: 'publish',
    scheduledAt: '2019-06-21T05:01:00.000Z',
    ...job,
    sys: {
      id: '1',
      ...job.sys
    }
  };
}

function createPendingJob(job = {}) {
  return createJob({ ...job, sys: { ...job.sys, status: 'pending' } });
}

function createFailedJob(job = {}) {
  return createJob({ ...job, sys: { ...job.sys, status: 'failed' } });
}

function createDoneJob(job = {}) {
  return createJob({ ...job, sys: { ...job.sys, status: 'done' } });
}

function createEntry(entry = {}) {
  return {
    ...entry,
    sys: {
      id: defaultEntryId(),
      ...entry.sys
    }
  };
}
