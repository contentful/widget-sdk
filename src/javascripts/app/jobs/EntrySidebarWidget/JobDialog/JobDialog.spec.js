import React from 'react';
import { render, cleanup, fireEvent, wait } from '@testing-library/react';
import 'jest-dom/extend-expect';
import JobDialog from './index.es6';

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
    const [{ getByTestId }] = build();

    expect(getByTestId('schedule-publication-modal')).toBeInTheDocument();
  });

  it('calls the onConfirm callback', async () => {
    const [{ getByTestId }, props] = build();

    await schedulePublication(getByTestId);

    expect(props.onCreate).toHaveBeenCalled();
  });

  it('calls the onCancel callback', async () => {
    const [{ getByTestId }, props] = build();
    const cancel = getByTestId('cancel');

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
    dateNowSpy.mockImplementationOnce(jest.fn(() => new Date(now).valueOf()));

    const [{ getByTestId }, props] = build();

    await schedulePublication(getByTestId);

    expect(props.onCreate).toHaveBeenCalledWith({
      scheduledAt: expected
    });
  });
});

async function schedulePublication(getByTestId) {
  const cta = getByTestId('schedule-publication');
  fireEvent.click(cta);
  await wait();
}
