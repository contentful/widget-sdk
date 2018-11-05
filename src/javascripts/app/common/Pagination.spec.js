import React from 'react';
import Enzyme from 'enzyme';

import Pagination from './Pagination.es6';
import { Button, Select } from '@contentful/ui-component-library';

describe('Pagination', () => {
  let onChangeFn = jest.fn();

  const mount = (skip, limit, total, loading) => {
    return Enzyme.shallow(
      <Pagination skip={skip} limit={limit} total={total} loading={loading} onChange={onChangeFn} />
    );
  };

  it('disables the Previous button if it is the first page', () => {
    const component = mount(0, 10, 100, false);
    expect(component).toMatchSnapshot();
  });

  it('enables the Previous and Next buttons if it is not the first page or last pages', () => {
    const component = mount(10, 10, 100, false);
    expect(component).toMatchSnapshot();
  });

  it('disables the Next button if it is the last page', () => {
    const component = mount(90, 10, 100, false);
    expect(component).toMatchSnapshot();
  });

  it('disables the Next and Previous buttons there is only one avialable page', () => {
    const component = mount(0, 10, 10, false);
    expect(component).toMatchSnapshot();
  });

  it('disables the Next and Previous buttons there is loading', () => {
    const component = mount(20, 10, 100, true);
    expect(component).toMatchSnapshot();
  });

  it('triggers onChange on the Next button click', () => {
    const currentSkip = 10;
    const limit = 10;
    const desiredSkip = currentSkip + limit;
    const component = mount(currentSkip, limit, 100, false);
    const nextBtn = component.find(Button).at(1);
    nextBtn.simulate('click');
    expect(onChangeFn).toHaveBeenCalledWith({ skip: desiredSkip, limit });
  });

  it('triggers onChange on the Previous button click', () => {
    const currentSkip = 10;
    const limit = 10;
    const desiredSkip = currentSkip - limit;
    const component = mount(currentSkip, limit, 100, false);
    const nextBtn = component.find(Button).at(0);
    nextBtn.simulate('click');
    expect(onChangeFn).toHaveBeenCalledWith({ skip: desiredSkip, limit });
  });

  it('trigger onChange on the limit selector change', () => {
    const component = mount(10, 10, 100, false);
    const limitSelector = component.find(Select);
    limitSelector.simulate('change', { target: { value: 25 } });
    expect(onChangeFn).toHaveBeenCalledWith({ skip: 10, limit: 25 });
  });
});
