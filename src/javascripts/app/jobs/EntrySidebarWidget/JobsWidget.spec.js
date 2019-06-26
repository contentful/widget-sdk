import React from 'react';
import { render, cleanup, wait } from '@testing-library/react';
import 'jest-dom/extend-expect';
import JobWidget from './JobsWidget.es6';
import { getJobs } from '../DataManagement/JobsService.es6';

jest.mock('../DataManagement/JobsService.es6');
describe('JobWidget', () => {
  afterEach(cleanup);

  const build = ({
    entity = {
      sys: {
        id: 'entryId'
      }
    }
  } = {}) => {
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
    await wait();
    expect(renderResult.getByTestId('schedule-publication')).toBeInTheDocument();
    expect(renderResult.queryByTestId('failed-job-note')).toBeNull();
  });

  it('renders Error note if publication date not defined', async () => {
    const failedJob = {
      scheduledAt: '2019-06-21T05:01:00.000Z',
      sys: {
        status: 'failed'
      }
    };
    getJobs.mockResolvedValueOnce({ items: [failedJob] });
    const unpublishedEntry = { sys: { id: 'entryId' } };
    const [renderResult] = build(unpublishedEntry);

    await wait();
    expect(renderResult.getByTestId('failed-job-note')).toBeInTheDocument();
  });

  it('renders Error note if publication date is not after last failed job', async () => {
    const failedJob = {
      scheduledAt: '2019-06-21T05:01:00.000Z',
      sys: {
        status: 'failed'
      }
    };
    getJobs.mockResolvedValueOnce({ items: [failedJob] });
    const unpublishedEntry = { sys: { id: 'entryId', publishedAt: '2019-06-21T05:00:00.000Z' } };
    const [renderResult] = build(unpublishedEntry);

    await wait();
    expect(renderResult.getByTestId('failed-job-note')).toBeInTheDocument();
  });
});
