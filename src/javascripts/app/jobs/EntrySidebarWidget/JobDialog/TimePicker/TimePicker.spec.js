import React from 'react';
import { render, cleanup, fireEvent } from '@testing-library/react';
import 'jest-dom/extend-expect';

import TimePicker from './index.es6';

describe('TimePicker', () => {
  let dateNowSpy;
  afterEach(cleanup);
  beforeAll(() => {
    dateNowSpy = jest.spyOn(Date, 'now');
  });

  afterAll(() => {
    dateNowSpy.mockRestore();
  });

  const build = ({ value }) => {
    const props = {
      onChange: jest.fn(),
      value
    };
    return [render(<TimePicker {...props} />), props];
  };

  it.each([['11:59'], ['10:59'], ['00:00'], ['01:05']])('renders hours and minutes, ', hhmm => {
    const [renderResult] = build({ value: hhmm });
    const [hh, mm] = hhmm.split(':');
    expect(renderResult.getByTestId('hours').value).toBe(hh);
    expect(renderResult.getByTestId('minutes').value).toBe(mm);
  });

  it.each([['11:59', '1', '01:59'], ['09:59', '2', '02:59'], ['01:59', '10', '10:59']])(
    'allows to set hours %p',
    (hhmm, inputValue, expected) => {
      const [renderResult, props] = build({ value: hhmm });

      const hours = renderResult.getByTestId('hours');

      fireEvent.change(hours, {
        target: { value: inputValue }
      });

      expect(props.onChange).toHaveBeenLastCalledWith(expected);
    }
  );
});
