import React from 'react';
import { render, fireEvent } from '@testing-library/react';

import * as DateMocks from '../__mocks__/DateMocks';
import TimezonePicker from '../TimezonePicker';

describe('TimezonePicker', () => {
  let dateNowSpy;
  beforeAll(() => {
    dateNowSpy = DateMocks.spyOnDateNow();
    DateMocks.mockNow(dateNowSpy, '2017-06-18T00:00:00.000+00:00');
  });

  const build = () => {
    const props = {
      onSelect: jest.fn(),
    };
    return [
      render(
        <div>
          <TimezonePicker {...props} />
        </div>
      ),
      props,
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
      target: { value: 'New Y' },
    });

    const newYorkItem = renderResult.queryByText('America/New York', { exact: false });
    fireEvent.click(newYorkItem);

    expect(props.onSelect).toHaveBeenCalledWith('America/New_York');
  });
});
