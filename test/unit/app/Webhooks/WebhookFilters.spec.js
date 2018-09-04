import React from 'react';
import Enzyme from 'enzyme';
import WebhookFilters from 'app/Webhooks/WebhookFilters.es6';
import {
  transformFiltersToList,
  transformListToFilters
} from 'app/Webhooks/WebhookFiltersState.es6';

describe('WebhookFilters', function() {
  const mount = filters => {
    const onChangeStub = sinon.stub();
    const wrapper = Enzyme.mount(
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

  it('lists no filters when an empty array is given', function() {
    const [wrapper] = mount([]);
    const filterRows = findFilterRows(wrapper);
    expect(filterRows.length).toBe(0);
  });

  it('adds default filter if anything but list given', function() {
    const [wrapper] = mount(undefined);
    const filterRows = findFilterRows(wrapper);
    expect(filterRows.length).toBe(1);
    assertFilterValues(filterRows.first(), 'sys.environment.sys.id', 0, 'master');
  });

  it('lists existing filters', function() {
    const [wrapper] = mount([
      { in: [{ doc: 'sys.environment.sys.id' }, ['master', 'staging']] },
      { not: { regexp: [{ doc: 'sys.contentType.sys.id' }, { pattern: 'foobar' }] } }
    ]);
    const filterRows = findFilterRows(wrapper);
    expect(filterRows.length).toBe(2);
    assertFilterValues(filterRows.at(0), 'sys.environment.sys.id', 2, 'master,staging');
    assertFilterValues(filterRows.at(1), 'sys.contentType.sys.id', 5, 'foobar');
  });

  it('deletes a filter', function() {
    const filters = [
      { in: [{ doc: 'sys.environment.sys.id' }, ['master', 'staging']] },
      { not: { regexp: [{ doc: 'sys.contentType.sys.id' }, { pattern: 'foobar' }] } }
    ];

    const [wrapper, onChangeStub] = mount(filters);
    const filterRows = findFilterRows(wrapper);
    expect(filterRows.length).toBe(2);

    const removeBtn = filterRows
      .first()
      .find('button')
      .first();
    removeBtn.simulate('click');
    sinon.assert.calledWith(onChangeStub, [filters[1]]);
  });

  it('adds a new filter', function() {
    const filters = [
      { in: [{ doc: 'sys.environment.sys.id' }, ['master', 'staging']] },
      { not: { regexp: [{ doc: 'sys.contentType.sys.id' }, { pattern: 'foobar' }] } }
    ];

    const [wrapper, onChangeStub] = mount(filters);
    const filterRows = findFilterRows(wrapper);
    expect(filterRows.length).toBe(2);

    const addBtn = wrapper.find('.cfnext-form__field > button').first();
    addBtn.simulate('click');
    sinon.assert.calledWith(onChangeStub, [
      ...filters,
      { equals: [{ doc: 'sys.environment.sys.id' }, ''] }
    ]);
  });
});
