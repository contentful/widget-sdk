import React from 'react';
import Enzyme from 'enzyme';
import sinon from 'sinon';
import WebhookFilters from '../WebhookFilters.es6';
import { transformFiltersToList, transformListToFilters } from '../WebhookFiltersState.es6';

describe('WebhookFilters', () => {
  const shallow = filters => {
    const onChangeStub = sinon.stub();
    const wrapper = Enzyme.shallow(
      <WebhookFilters
        filters={transformFiltersToList(filters)}
        onChange={list => onChangeStub(transformListToFilters(list))}
      />
    );

    return [wrapper, onChangeStub];
  };

  const findFilterRows = wrapper => wrapper.find('.webhook-editor__settings-row');

  const assertFilterValues = (filterRow, path, constraint, value) => {
    const selectBoxes = filterRow.find('select');
    const valueInput = filterRow.find('input').first();

    expect(selectBoxes.at(0).prop('value')).toBe(path);
    expect(selectBoxes.at(1).prop('value')).toBe(constraint);
    expect(valueInput.prop('value')).toBe(value);
  };

  it('lists no filters when an empty array is given', () => {
    const [wrapper] = shallow([]);
    const filterRows = findFilterRows(wrapper);
    expect(filterRows).toHaveLength(0);
  });

  it('adds default filter if anything but list given', () => {
    const [wrapper] = shallow(undefined);
    const filterRows = findFilterRows(wrapper);
    expect(filterRows).toHaveLength(1);
    assertFilterValues(filterRows.first(), 'sys.environment.sys.id', 0, 'master');
  });

  it('lists existing filters', () => {
    const [wrapper] = shallow([
      { in: [{ doc: 'sys.environment.sys.id' }, ['master', 'staging']] },
      { not: { regexp: [{ doc: 'sys.contentType.sys.id' }, { pattern: 'foobar' }] } }
    ]);
    const filterRows = findFilterRows(wrapper);
    expect(filterRows).toHaveLength(2);
    assertFilterValues(filterRows.at(0), 'sys.environment.sys.id', 2, 'master,staging');
    assertFilterValues(filterRows.at(1), 'sys.contentType.sys.id', 5, 'foobar');
  });

  it('deletes a filter', () => {
    const filters = [
      { in: [{ doc: 'sys.environment.sys.id' }, ['master', 'staging']] },
      { not: { regexp: [{ doc: 'sys.contentType.sys.id' }, { pattern: 'foobar' }] } }
    ];

    const [wrapper, onChangeStub] = shallow(filters);
    const filterRows = findFilterRows(wrapper);
    expect(filterRows).toHaveLength(2);

    const removeBtn = filterRows
      .first()
      .find('button')
      .first();
    removeBtn.simulate('click');
    expect(onChangeStub.calledWith([filters[1]])).toBeTruthy();
  });

  it('adds a new filter', () => {
    const filters = [
      { in: [{ doc: 'sys.environment.sys.id' }, ['master', 'staging']] },
      { not: { regexp: [{ doc: 'sys.contentType.sys.id' }, { pattern: 'foobar' }] } }
    ];

    const [wrapper, onChangeStub] = shallow(filters);
    const filterRows = findFilterRows(wrapper);
    expect(filterRows).toHaveLength(2);

    const addBtn = wrapper.find('.cfnext-form__field > button').first();
    addBtn.simulate('click');
    expect(
      onChangeStub.calledWith([...filters, { equals: [{ doc: 'sys.environment.sys.id' }, ''] }])
    ).toBeTruthy();
  });
});
