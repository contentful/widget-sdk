import React from 'react';
import { render, cleanup, fireEvent } from '@testing-library/react';
import 'jest-dom/extend-expect';

import TimePicker from './index.es6';
import { getPreferredTimeFormat, TimeFormat } from './TimeFormatDetector.es6';

jest.mock('./TimeFormatDetector.es6', () => ({
  ...jest.genMockFromModule('./TimeFormatDetector.es6'),
  getTimeFormat: jest.fn()
}));

describe('TimePicker', () => {
  let dateNowSpy;
  let timeFormatDetectorMock;
  afterEach(cleanup);
  beforeAll(() => {
    dateNowSpy = jest.spyOn(Date, 'now');
  });

  afterAll(() => {
    dateNowSpy.mockRestore();
    timeFormatDetectorMock.mockRestore();
  });

  const build = ({ value }) => {
    const props = {
      onChange: jest.fn(),
      value
    };
    return [render(<TimePicker {...props} />), props];
  };

  describe('24h', () => {
    beforeEach(() => {
      getPreferredTimeFormat.mockReturnValueOnce(TimeFormat.H24);
    });
    it.each([['11:59'], ['10:59'], ['00:00'], ['01:05'], ['23:59']])(
      'renders hours and minutes %p',
      hhmm => {
        const [renderResult] = build({ value: hhmm });
        const [hh, mm] = hhmm.split(':');
        expect(renderResult.getByTestId('hours').value).toBe(hh);
        expect(renderResult.getByTestId('minutes').value).toBe(mm);
      }
    );

    it.each([
      ['11:59', '1', '01:59'],
      ['09:59', '2', '02:59'],
      ['01:59', '10', '10:59'],
      ['09:59', '88', '23:59'],
      ['09:59', '-', '00:59']
    ])('allows to set hours %p', (hhmm, inputValue, expected) => {
      const [renderResult, props] = build({ value: hhmm });

      fireChangeEvent(renderResult.getByTestId('hours'), inputValue);

      expect(props.onChange).toHaveBeenLastCalledWith(expected);
    });

    it.each([
      ['11:59', '1', '11:01'],
      ['09:59', '2', '09:02'],
      ['01:59', '10', '01:10'],
      ['09:59', '88', '09:59'],
      ['09:59', '-', '09:00']
    ])('allows to set minutes %p', (hhmm, inputValue, expected) => {
      const [renderResult, props] = build({ value: hhmm });

      fireChangeEvent(renderResult.getByTestId('minutes'), inputValue);

      expect(props.onChange).toHaveBeenLastCalledWith(expected);
    });
  });

  describe('12h', () => {
    beforeEach(() => {
      getPreferredTimeFormat.mockReturnValueOnce(TimeFormat.H12);
    });
    it.each([
      ['11:59', '11', '59', 'AM'],
      ['10:59', '10', '59', 'AM'],
      ['00:00', '12', '00', 'AM'],
      ['01:05', '01', '05', 'AM'],
      ['13:05', '01', '05', 'PM'],
      ['23:59', '11', '59', 'PM']
    ])('renders hours and minutes %p', (hhmm, hh, mm, ampm) => {
      const [renderResult] = build({ value: hhmm });

      expect(renderResult.getByTestId('hours').value).toBe(hh);
      expect(renderResult.getByTestId('minutes').value).toBe(mm);
      expect(renderResult.getByTestId('ampm').value).toBe(ampm);
    });

    it.each([
      ['11:59', '1', '01:59'],
      ['09:59', '2', '02:59'],
      ['01:59', '10', '10:59'],
      ['09:59', '88', '00:59'],
      ['09:59', '-', '00:59']
    ])('allows to set hours %p', async (hhmm, inputValue, expected) => {
      const [renderResult, props] = build({ value: hhmm });

      fireChangeEvent(renderResult.getByTestId('hours'), inputValue);

      expect(props.onChange).toHaveBeenLastCalledWith(expected);
    });

    it.each([
      ['11:59', '1', '11:01'],
      ['09:59', '2', '09:02'],
      ['01:59', '10', '01:10'],
      ['09:59', '88', '09:59'],
      ['09:59', '-', '09:00']
    ])('allows to set minutes %p', (hhmm, inputValue, expected) => {
      const [renderResult, props] = build({ value: hhmm });

      fireChangeEvent(renderResult.getByTestId('minutes'), inputValue);

      expect(props.onChange).toHaveBeenLastCalledWith(expected);
    });

    it.each([['11:59', 'PM', '23:59'], ['09:59', 'PM', '21:59'], ['23:59', 'AM', '11:59']])(
      'allows to set ampm %p %p',
      (hhmm, ampmValue, expected) => {
        const [renderResult, props] = build({ value: hhmm });

        fireChangeEvent(renderResult.getByTestId('ampm'), ampmValue);

        expect(props.onChange).toHaveBeenLastCalledWith(expected);
      }
    );
  });
});

function fireChangeEvent(element, value) {
  fireEvent.change(element, {
    target: { value: value }
  });
}
