import React from 'react';
import { render, cleanup, fireEvent, wait } from '@testing-library/react';
import { Notification } from '@contentful/forma-36-react-components';

import '@testing-library/jest-dom/extend-expect';
import * as DateMocks from 'DateMocks';
import JobDialog from './index';
import moment from 'moment';

import * as JobsAnalytics from 'app/jobs/Analytics/JobsAnalytics';
import APIClient from 'data/APIClient';

jest.mock('data/APIClient', () =>
  jest.fn().mockImplementation(() => ({ validateEntry: jest.fn().mockReturnValue() }))
);

describe('JobDialog', () => {
  let dateNowSpy;
  afterEach(cleanup);
  beforeAll(() => {
    dateNowSpy = DateMocks.spyOnDateNow();
    DateMocks.mockNow(dateNowSpy, '2017-06-18T00:00:00.000+00:00');
  });

  afterAll(() => {
    jest.clearAllMocks();
  });

  const build = () => {
    const props = {
      spaceId: 'spaceId',
      environmentId: 'environmentId',
      entity: {},
      validator: { setApiResponseErrors() {} },
      entryTitle: 'Test',
      onCreate: jest.fn(),
      onCancel: jest.fn(),
      isSubmitting: false
    };
    return [render(<JobDialog {...props} />), props];
  };

  it('renders scheduling dialog', () => {
    const [renderResult] = build();

    expect(renderResult.getByTestId('schedule-publication-modal')).toBeInTheDocument();
  });

  it('calls the onConfirm callback', async () => {
    const [renderResult, props] = build();

    await schedulePublication(renderResult);

    expect(props.onCreate).toHaveBeenCalled();
  });

  it('calls the onCancel callback', async () => {
    const [renderResult, props] = build();
    const cancel = renderResult.getByTestId('cancel');

    fireEvent.click(cancel);

    await wait();
    expect(props.onCancel).toHaveBeenCalled();
  });

  it.each([
    ['2017-06-18T15:33', '2017-06-18T16:00:00.000+00:00'],
    ['2018-06-18T15:33:12', '2018-06-18T16:00:00.000+00:00'],
    ['2018-06-18T00:01', '2018-06-18T01:00:00.000+00:00'],
    ['2018-06-18T23:55', '2018-06-19T00:00:00.000+00:00'],
    ['2018-12-31T23:52', '2019-01-01T00:00:00.000+00:00']
  ])('default values are the full hour in the future: %p => %p', async (now, expected) => {
    DateMocks.mockNowOnce(dateNowSpy, now);

    const [renderResult, props] = build();

    await schedulePublication(renderResult);

    expect(props.onCreate).toHaveBeenCalledWith(
      {
        scheduledAt: expected,
        action: 'publish'
      },
      'Africa/Abidjan'
    );
  });

  it.each([
    ['2017-06-18T15:59', 'Africa/Nairobi', '2017-06-18T16:00:00.000+03:00'],
    ['2017-06-18T16:59', 'Africa/Nairobi', '2017-06-18T17:00:00.000+03:00'],
    ['2017-06-18T16:59', 'Europe/London', '2017-06-18T17:00:00.000+01:00'],
    ['2017-12-01T16:59', 'Europe/Berlin', '2017-12-01T17:00:00.000+01:00']
  ])('allows to set timezone: %p + %p => %p', async (now, timezone, expected) => {
    DateMocks.mockNowOnce(dateNowSpy, now);

    const [renderResult, props] = build();

    const tz = renderResult.getByTestId('autocomplete.input');

    fireEvent.focus(tz);
    fireEvent.change(tz, {
      target: { value: timezone }
    });
    fireEvent.blur(tz);

    const selectedItem = renderResult.getByText(timezone, { exact: false });
    fireEvent.click(selectedItem);

    const expectedLocalTime = moment(expected).format('ddd, MMM Do, YYYY - hh:mm A');

    expect(
      renderResult.getByText(`The scheduled time you have selected will be: ${expectedLocalTime}`, {
        exact: false
      })
    ).toBeInTheDocument();
    await schedulePublication(renderResult);
    expect(props.onCreate).toHaveBeenCalledWith(
      {
        scheduledAt: expected,
        action: 'publish'
      },
      timezone
    );
  });

  it('prevents to schedule a publication if selected date is in the past', async () => {
    DateMocks.mockNowOnce(dateNowSpy, moment(Date.now()).subtract(1, 'hours'));

    const [renderResult, props] = build();

    await schedulePublication(renderResult);
    expect(renderResult.getByTestId('job-dialog-validation-message')).toBeInTheDocument();
    expect(props.onCreate).not.toHaveBeenCalled();
  });

  it('allows to schedule a publication if selected date is in the future', async () => {
    DateMocks.mockNowOnce(dateNowSpy, moment(Date.now()).add(1, 'hours'));

    const [renderResult, props] = build();

    await schedulePublication(renderResult);
    expect(renderResult.queryByTestId('job-dialog-validation-message')).toBeNull();
    expect(props.onCreate).toHaveBeenCalled();
  });

  describe('analytics', () => {
    it('tracks opening the scheduling dialog', () => {
      const createDialogOpenSpy = jest.spyOn(JobsAnalytics, 'createDialogOpen');

      build();

      expect(createDialogOpenSpy).toHaveBeenCalledTimes(1);
    });

    it('tracks closing the scheduling dialog', () => {
      const createDialogCloseSpy = jest.spyOn(JobsAnalytics, 'createDialogClose');
      const [renderResult] = build();

      renderResult.unmount();

      expect(createDialogCloseSpy).toHaveBeenCalledTimes(1);
    });
  });

  it('shows the validation message', async () => {
    jest.spyOn(Notification, 'error').mockImplementation(() => {});
    APIClient.mockReset().mockImplementation(() => ({
      validateEntry() {
        throw new Error('Invalid entity');
      }
    }));

    const [renderResult] = build();

    await schedulePublication(renderResult);

    expect(Notification.error).toHaveBeenCalledWith(
      'Error scheduling Test: Validation failed. Please check the individual fields for errors.'
    );
  });
});

async function schedulePublication(container) {
  const cta = container.getByTestId('schedule-publication');
  fireEvent.click(cta);
  await wait();
}
