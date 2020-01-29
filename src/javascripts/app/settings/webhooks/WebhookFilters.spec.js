import React from 'react';

import { render, fireEvent } from '@testing-library/react';
import WebhookFilters from './WebhookFilters';
import { transformFiltersToList, transformListToFilters } from './WebhookFiltersState';

describe('WebhookFilters', () => {
  const renderComponent = filters => {
    const onChangeStub = jest.fn();
    const wrapper = render(
      <WebhookFilters
        filters={transformFiltersToList(filters)}
        onChange={list => onChangeStub(transformListToFilters(list))}
      />
    );

    return [wrapper, onChangeStub];
  };

  const assertFilterValues = (filterRow, path, constraint, value) => {
    const selectBoxes = filterRow.querySelectorAll('select');
    const valueInput = filterRow.querySelector('input');

    expect(selectBoxes[0].value).toBe(path);
    expect(selectBoxes[1].value).toBe(constraint);
    expect(valueInput.value).toBe(value);
  };

  it('lists no filters when an empty array is given', () => {
    const [{ queryAllByTestId }] = renderComponent([]);
    const filterRows = queryAllByTestId('filter-setting-row');
    expect(filterRows).toHaveLength(0);
  });

  it('adds default filter if anything but list given', () => {
    const [{ getAllByTestId }] = renderComponent(undefined);
    const filterRows = getAllByTestId('filter-setting-row');
    expect(filterRows).toHaveLength(1);
    assertFilterValues(filterRows[0], 'sys.environment.sys.id', '0', 'master');
  });

  it('lists existing filters', () => {
    const [{ getAllByTestId }] = renderComponent([
      { in: [{ doc: 'sys.environment.sys.id' }, ['master', 'staging']] },
      { not: { regexp: [{ doc: 'sys.contentType.sys.id' }, { pattern: 'foobar' }] } }
    ]);
    const filterRows = getAllByTestId('filter-setting-row');
    expect(filterRows).toHaveLength(2);
    assertFilterValues(filterRows[0], 'sys.environment.sys.id', '2', 'master,staging');
    assertFilterValues(filterRows[1], 'sys.contentType.sys.id', '5', 'foobar');
  });

  it('deletes a filter', () => {
    const filters = [
      { in: [{ doc: 'sys.environment.sys.id' }, ['master', 'staging']] },
      { not: { regexp: [{ doc: 'sys.contentType.sys.id' }, { pattern: 'foobar' }] } }
    ];

    const [{ getAllByTestId }, onChangeStub] = renderComponent(filters);
    const filterRows = getAllByTestId('filter-setting-row');
    expect(filterRows).toHaveLength(2);

    const removeBtn = filterRows[0].querySelector('[data-test-id="remove-webhook-filter"]');
    fireEvent.click(removeBtn);
    expect(onChangeStub).toHaveBeenCalledWith([filters[1]]);
  });

  it('adds a new filter', () => {
    const filters = [
      { in: [{ doc: 'sys.environment.sys.id' }, ['master', 'staging']] },
      { not: { regexp: [{ doc: 'sys.contentType.sys.id' }, { pattern: 'foobar' }] } }
    ];

    const [{ getAllByTestId, getByTestId }, onChangeStub] = renderComponent(filters);
    const filterRows = getAllByTestId('filter-setting-row');
    expect(filterRows).toHaveLength(2);

    const addBtn = getByTestId('add-webhook-filter');
    fireEvent.click(addBtn);

    expect(onChangeStub).toHaveBeenCalledWith([
      ...filters,
      { equals: [{ doc: 'sys.environment.sys.id' }, ''] }
    ]);
  });
});
