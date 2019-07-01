import React from 'react';
import { render, cleanup, wait } from '@testing-library/react';
import 'jest-dom/extend-expect';

import { Notification } from '@contentful/forma-36-react-components';
import JobWidget from './JobsWidget.es6';
import { getJobs } from '../DataManagement/JobsService.es6';

jest.mock('../DataManagement/JobsService.es6');
describe('JobWidget', () => {
  beforeEach(() => {
    jest.spyOn(Notification, 'success').mockImplementation(() => {});
    jest.spyOn(Notification, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    cleanup();
    jest.clearAllMocks();
  });

  const build = ({ entity = createEntry() } = {}) => {
    const props = {
      spaceId: 'spaceId',
      environmentId: 'enviromentId',
      userId: 'userId',
      entity
    };

    return [render(<JobWidget {...props} />), props];
  };

  it('renders scheduling widget', async () => {
    getJobs.mockResolvedValueOnce({ items: [] });
    const [renderResult] = build();

    expect(renderResult.getByTestId('jobs-skeleton')).toBeInTheDocument();
    expect(renderResult.queryByTestId('schedule-publication')).toBeNull();
    expect(getJobs).toHaveBeenCalledWith(expect.any(Function), {
      order: '-sys.scheduledAt',
      'sys.entity.sys.id': defaultEntryId()
    });

    await wait();
    expect(renderResult.getByTestId('schedule-publication')).toBeInTheDocument();
    expect(renderResult.queryByTestId('jobs-skeleton')).toBeNull();
    expect(renderResult.queryByTestId('failed-job-note')).toBeNull();
  });

  describe('renders an error note when the last job failed and', () => {
    it('entry is not published', async () => {
      const failedJob = createFailedJob({
        scheduledAt: '2019-06-21T05:01:00.000Z'
      });
      getJobs.mockResolvedValueOnce({ items: [failedJob] });
      const unpublishedEntry = { sys: { id: 'entryId' } };
      const [renderResult] = build(unpublishedEntry);

      await wait();
      expect(renderResult.getByTestId('schedule-publication')).toBeInTheDocument();
      expect(renderResult.getByTestId('failed-job-note')).toBeInTheDocument();
    });

    it('entry is published but publication date is before last failed job', async () => {
      const failedJob = createFailedJob({
        scheduledAt: '2019-06-21T05:01:00.000Z'
      });
      getJobs.mockResolvedValueOnce({ items: [failedJob] });
      const publishedEntry = { sys: { id: 'entryId', publishedAt: '2019-06-21T05:00:00.000Z' } };
      const [renderResult] = build(publishedEntry);

      await wait();

      expect(renderResult.getByTestId('schedule-publication')).toBeInTheDocument();
      expect(renderResult.getByTestId('failed-job-note')).toBeInTheDocument();
    });
  });

  describe('on new props', () => {
    it('does not rerender if publishedAt date is the same', async () => {
      getJobs.mockResolvedValueOnce({ items: [createPendingJob()] });
      const publishedEntry = createEntry({ sys: { publishedAt: '2019-06-21T05:00:00.000Z' } });
      const [renderResult, props] = build({ entity: publishedEntry });

      await wait();

      const publishedEntryWithSameDate = createEntry({
        sys: { publishedAt: '2019-06-21T05:00:00.000Z' }
      });
      renderResult.rerender(<JobWidget {...props} entity={publishedEntryWithSameDate} />);
      await wait();

      expect(getJobs).toHaveBeenCalledTimes(1);
    });

    it('rerenders if publishedAt date changed', async () => {
      getJobs.mockResolvedValueOnce({ items: [createPendingJob()] });
      const publishedEntry = createEntry({ sys: { publishedAt: '2019-06-21T05:00:00.000Z' } });
      const [renderResult, props] = build({ entity: publishedEntry });

      await wait();

      getJobs.mockResolvedValueOnce({ items: [createPendingJob()] });
      const newPublishedEntry = createEntry({ sys: { publishedAt: '2019-06-21T06:00:00.000Z' } });
      renderResult.rerender(<JobWidget {...props} entity={newPublishedEntry} />);
      await wait();

      expect(getJobs).toHaveBeenCalledTimes(2);
    });

    it('shows toast when entry was successfully published on schedule', async () => {
      getJobs.mockResolvedValueOnce({ items: [createPendingJob()] });
      const publishedEntry = createEntry({ sys: { publishedAt: '2019-06-21T05:00:00.000Z' } });
      const [renderResult, props] = build({ entity: publishedEntry });

      await wait();

      getJobs.mockResolvedValueOnce({ items: [createDoneJob()] });
      const newPublishedEntry = createEntry({ sys: { publishedAt: '2019-06-21T06:00:00.000Z' } });
      renderResult.rerender(<JobWidget {...props} entity={newPublishedEntry} />);
      await wait();

      expect(getJobs).toHaveBeenCalledTimes(2);
      expect(Notification.success).toHaveBeenCalledWith('Entry was successfully published.');
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
