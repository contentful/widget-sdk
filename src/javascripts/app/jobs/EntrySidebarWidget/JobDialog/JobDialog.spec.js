import React from 'react';
import { render, cleanup, fireEvent, wait, getByText } from '@testing-library/react';
import 'jest-dom/extend-expect';
import JobDialog from './index.es6';
import moment from 'moment';

describe('JobDialog', () => {
  let dateNowSpy;
  afterEach(cleanup);
  beforeAll(() => {
    dateNowSpy = jest.spyOn(Date, 'now');
  });

  afterAll(() => {
    dateNowSpy.mockRestore();
  });

  const build = () => {
    const props = {
      onCreate: jest.fn(),
      onCancel: jest.fn()
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
    ['2017-06-18T15:33', '2017-06-18T16:03:00.000+00:00'],
    ['2018-06-18T15:33:12', '2018-06-18T16:03:00.000+00:00'],
    ['2018-06-18T00:01', '2018-06-18T00:31:00.000+00:00'],
    ['2018-06-18T23:55', '2018-06-19T00:25:00.000+00:00'],
    ['2018-12-31T23:52', '2019-01-01T00:22:00.000+00:00']
  ])('default values are +30min in the future: %p => %p', async (now, expected) => {
    mockDateOnce(dateNowSpy, now);

    const [renderResult, props] = build();

    await schedulePublication(renderResult);

    expect(props.onCreate).toHaveBeenCalledWith({
      scheduledAt: expected
    });
  });

  it.each([
    ['2017-06-18T15:30', '(GMT+03:00)', '2017-06-18T16:00:00.000+03:00'],
    ['2017-06-18T16:30', '(GMT+03:00)', '2017-06-18T17:00:00.000+03:00'],
    ['2017-06-18T16:30', '(GMT+01:00)', '2017-06-18T17:00:00.000+01:00']
  ])('allows to set timezone: %p + %p => %p', async (now, offset, expected) => {
    mockDateOnce(dateNowSpy, now);

    const [renderResult, props] = build();

    const tz = renderResult.getByLabelText('timezone', {
      selector: 'select'
    });

    fireEvent.change(tz, {
      target: { value: getByText(tz, offset, { exact: false }).value }
    });

    const expectedLocalTime = moment(expected).format('ddd, MMM Do, YYYY - hh:mm A');

    expect(
      renderResult.getByText(`The scheduled time you have selected will be: ${expectedLocalTime}`, {
        exact: false
      })
    ).toBeInTheDocument();

    await schedulePublication(renderResult);

    expect(props.onCreate).toHaveBeenCalledWith({
      scheduledAt: expected
    });
  });
});

function mockDateOnce(dateNowSpy, now) {
  dateNowSpy.mockImplementationOnce(jest.fn(() => new Date(now).valueOf()));
}

async function schedulePublication(container) {
  const cta = container.getByTestId('schedule-publication');
  fireEvent.click(cta);
  await wait();
}
