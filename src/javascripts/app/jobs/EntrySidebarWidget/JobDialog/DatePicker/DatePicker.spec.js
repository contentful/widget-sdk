import React from 'react';
import { render, cleanup, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom/extend-expect';

import DatePicker from './index.es6';

describe('DatePicker', () => {
  afterEach(cleanup);

  const build = () => {
    const props = {
      labelText: 'label text',
      value: new Date('2017-01-01'),
      onChange: jest.fn()
    };
    return [render(<DatePicker {...props} />), props];
  };

  it('renders datepicker on focus', () => {
    const [renderResult] = build();

    const dateInput = renderResult.getByTestId('date-input');
    expect(dateInput).toBeInTheDocument();
    expect(getDatepicker(renderResult).classList.contains('is-hidden')).toBeTruthy();

    fireEvent.focus(dateInput);

    expect(getDatepicker(renderResult).classList.contains('is-hidden')).toBeFalsy();

    const yearSelect = getDatepicker(renderResult).querySelector('.pika-select-year');
    fireEvent.focus(yearSelect);

    expect(getDatepicker(renderResult).classList.contains('is-hidden')).toBeFalsy();

    fireEvent.blur(dateInput);

    expect(getDatepicker(renderResult).classList.contains('is-hidden')).toBeTruthy();
  });
});
function getDatepicker(renderResult) {
  return renderResult.baseElement.getRootNode().querySelector('.pika-single');
}
