import React from 'react';
import { cloneDeep } from 'lodash';
import { shallow } from 'enzyme';
import sinon from 'sinon';
import { getFilterDefinitions } from './FilterDefinitions.es6';
import SearchFilter from './SearchFilter.es6';
import UserListFilters from './UserListFilters.es6';
import { TextLink } from '@contentful/ui-component-library';

describe('UserListFilters', () => {
  const filters = getFilterDefinitions();
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
    onChangeCb = sinon.stub();
    onResetCb = sinon.stub();
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
    expect(onChangeCb.getCall(0).args[0]).toHaveLength(filters.length);
    expect(onChangeCb.getCall(0).args[0][0]).toHaveProperty(['filter'], filter);
  });

  it('should not show the reset button if no filters are active', () => {
    expect(component.find(TextLink)).toHaveLength(0);
  });

  it('should show the reset button if there are active vilters', () => {
    component.setProps({ filters: activeFilters });
    expect(component.find(TextLink)).toHaveLength(1);
  });

  it('triggers the reset callback', () => {
    component.setProps({ filters: activeFilters });
    component.find(TextLink).simulate('click');
    expect(onResetCb.called).toBe(true);
  });
});
