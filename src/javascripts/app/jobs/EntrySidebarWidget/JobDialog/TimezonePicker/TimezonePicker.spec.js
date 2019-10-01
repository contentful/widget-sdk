import React from 'react';
import { render, cleanup, fireEvent } from '@testing-library/react';

import 'jest-dom/extend-expect';
import * as DateMocks from 'DateMocks';
import TimezonePicker from './index.es6';

describe('TimezonePicker', () => {
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
      onSelect: jest.fn()
    };
    return [
      render(
        <div>
          <TimezonePicker {...props} />
        </div>
      ),
      props
    ];
  };

  it('renders scheduling dialog', () => {
    const [renderResult] = build();

    expect(renderResult.getByTestId('timezone-picker')).toBeInTheDocument();
  });

  it('calls onSelect on Enter with selection', async () => {
    const [renderResult, props] = build();

    const tz = renderResult.getByTestId('autocomplete.input');

    fireEvent.focus(tz);
    fireEvent.change(tz, {
      target: { value: 'New Y' }
    });

    const newYorkItem = renderResult.getByText('(GMT-04:00) - America/New York');
    fireEvent.click(newYorkItem);

    expect(props.onSelect).toHaveBeenCalledWith('America/New_York');
  });
});
