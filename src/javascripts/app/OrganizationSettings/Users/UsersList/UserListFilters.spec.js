import React from 'react';
import { cloneDeep } from 'lodash';
import { render, screen, fireEvent } from '@testing-library/react';
import { generateFilterDefinitions } from './FilterDefinitions';
import { UserListFilters } from './UserListFilters';

const onChangeCb = jest.fn();
const onResetCb = jest.fn();
const filters = generateFilterDefinitions({});
const activeFilters = cloneDeep(filters);
activeFilters[1].filter = { key: 'sys.status', value: 'active' };

async function build(props) {
  return render(
    <UserListFilters
      filters={filters}
      queryTotal={1}
      onChange={onChangeCb}
      onReset={onResetCb}
      {...props}
    />
  );
}

describe('UserListFilters', () => {
  it('should render all options', async () => {
    await build();
    expect(screen.getAllByTestId('search-filter')).toHaveLength(filters.length);
  });

  it('should trigger the onChange callback when any of the filters change', async () => {
    await build();
    const filters = generateFilterDefinitions({});
    filters[0].filter = {
      id: 'sort',
      key: 'order',
      value: 'sys.createdAt',
    };

    const selectEl = screen.getAllByTestId('search-filter.options');
    fireEvent.change(selectEl[0], { target: { value: 'sys.createdAt' } });
    expect(onChangeCb).toHaveBeenCalledTimes(1);
    expect(onChangeCb).toHaveBeenCalledWith(filters);
  });

  it('should not show the reset button if no filters are active', async () => {
    await build();
    expect(screen.queryAllByText('Clear filters')).toHaveLength(0);
  });

  it('should show the reset button if there are active filters', async () => {
    await build({ filters: activeFilters });
    expect(screen.getByText('Clear filters')).toBeVisible();
  });

  it('triggers the reset callback', async () => {
    await build({ filters: activeFilters });
    fireEvent.click(screen.getByText('Clear filters'));
    expect(onResetCb).toHaveBeenCalledTimes(1);
  });
});
