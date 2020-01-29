import React from 'react';

import { render, fireEvent, getByTestId } from '@testing-library/react';
import { WebhookHeaders } from './WebhookHeaders';

describe('WebhookHeaders', () => {
  const renderComponent = headers => {
    const onChangeStub = jest.fn();
    return [render(<WebhookHeaders headers={headers} onChange={onChangeStub} />), onChangeStub];
  };

  it('lists no headers when none defined', () => {
    const [{ queryAllByTestId }] = renderComponent([]);
    const headerRows = queryAllByTestId('setting-row');
    expect(headerRows).toHaveLength(0);
  });

  it('renders headers', () => {
    const [{ getAllByTestId }] = renderComponent([
      { key: 'X-Custom-Header-1', value: '123' },
      { key: 'X-Custom-Header-2', value: 'xyz' }
    ]);
    const headerRows = getAllByTestId('setting-row');
    expect(headerRows).toHaveLength(2);

    const values = [];
    headerRows.forEach(row => {
      row.querySelectorAll('input').forEach(input => {
        values.push(input.value);
      });
    });

    expect(values).toEqual(['X-Custom-Header-1', '123', 'X-Custom-Header-2', 'xyz']);
  });

  it('adds a new header', () => {
    const header = { key: 'X-Custom-Header-1', value: '123' };
    const [{ getAllByTestId, getByTestId }, onChangeStub] = renderComponent([header]);
    const headerRows = getAllByTestId('setting-row');
    expect(headerRows).toHaveLength(1);

    const addBtn = getByTestId('add-custom-header');
    fireEvent.click(addBtn);
    expect(onChangeStub).toHaveBeenCalledWith([header, {}]);
  });

  it('removes a header', () => {
    const headers = [
      { key: 'X-Custom-Header-1', value: '123' },
      { key: 'X-Custom-Header-2', value: 'xyz' }
    ];

    const [{ getAllByTestId }, onChangeStub] = renderComponent(headers);
    const headerRows = getAllByTestId('setting-row');
    expect(headerRows).toHaveLength(2);

    const removeBtn = getByTestId(headerRows[1], 'remove-header');
    fireEvent.click(removeBtn);
    expect(onChangeStub).toHaveBeenCalledWith([headers[0]]);
  });

  it('renders secret headers disabled not exposing value', () => {
    const headers = [
      { key: 'test', value: 'public' },
      { key: 'test2', value: 'secret', secret: true }
    ];

    const [{ getAllByTestId }] = renderComponent(headers);

    const headerRows = getAllByTestId('setting-row');

    const inputs = [];
    headerRows.forEach(row => {
      row.querySelectorAll('input').forEach(input => {
        inputs.push(input);
      });
    });

    ['test', 'public', 'test2', ''].forEach((value, i) => {
      expect(inputs[i].value).toBe(value);
    });
    expect(inputs[2]).toBeDisabled();
    expect(inputs[3]).toHaveAttribute('type', 'password');
    expect(inputs[3]).toHaveAttribute('readOnly');
  });
});
