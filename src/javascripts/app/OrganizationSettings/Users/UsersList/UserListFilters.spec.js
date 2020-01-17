import React from 'react';
import { cloneDeep } from 'lodash';
import { shallow } from 'enzyme';
import { generateFilterDefinitions } from './FilterDefinitions';
import SearchFilter from './SearchFilter';
import { UserListFilters } from './UserListFilters';
import { TextLink } from '@contentful/forma-36-react-components';

describe('UserListFilters', () => {
  const filters = generateFilterDefinitions({});
  const activeFilters = cloneDeep(filters);
  activeFilters[1].filter.value = 'foo';

  let onChangeCb, onResetCb, component;

  function simulateChange(filter) {
    component
      .find(SearchFilter)
      .at(1)
      .simulate('change', filter);
  }

  beforeEach(() => {
    onChangeCb = jest.fn();
    onResetCb = jest.fn();
    component = shallow(
      <UserListFilters
        filters={filters}
        queryTotal={99}
        onChange={onChangeCb}
        onReset={onResetCb}
      />
    );
  });

  it('should render all options', () => {
    expect(component.find(SearchFilter)).toHaveLength(filters.length);
  });

  it('should trigger the onChange callback when any of the filters change', () => {
    const filter = {
      key: 'order',
      value: 'sys.createdAt'
    };
    simulateChange(filter);
    expect(onChangeCb.mock.calls[0][0]).toHaveLength(filters.length);
    expect(onChangeCb.mock.calls[0][0][0]).toHaveProperty(['filter'], filter);
  });

  it('should not show the reset button if no filters are active', () => {
    expect(component.find(TextLink)).toHaveLength(0);
  });

  it('should show the reset button if there are active filters', () => {
    component.setProps({ filters: activeFilters });
    expect(component.find(TextLink)).toHaveLength(1);
  });

  it('triggers the reset callback', () => {
    component.setProps({ filters: activeFilters });
    component.find(TextLink).simulate('click');
    expect(onResetCb).toHaveBeenCalledTimes(1);
  });
});
