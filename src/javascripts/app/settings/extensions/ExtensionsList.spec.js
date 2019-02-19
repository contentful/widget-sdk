import React from 'react';
import Enzyme from 'enzyme';
import ExtensionsList from './ExtensionsList.es6';
import * as $stateMocked from 'ng/$state';

describe('app/settings/extensions/Extensions', () => {
  beforeEach(() => {
    $stateMocked.go.mockClear();
  });

  const refresh = () => Promise.resolve({});
  const mount = (extensions = []) => {
    return Enzyme.mount(<ExtensionsList extensions={extensions} refresh={refresh} />);
  };

  const extensions = [
    {
      id: 'hello',
      name: 'hello',
      fieldTypes: 'Boolean',
      hosting: 'Contentful',
      parameterCounts: {
        instanceDefinitions: 1,
        installationDefinitions: 1,
        installationValues: 0
      }
    },
    {
      id: 'test',
      name: 'Widget 1',
      fieldTypes: 'Number',
      hosting: 'self-hosted',
      parameterCounts: {}
    },
    {
      id: 'test2',
      name: 'Widget 2',
      fieldTypes: 'Symbol, Text',
      hosting: 'self-hosted',
      parameterCounts: {}
    }
  ];

  it('shows empty message', function() {
    expect.assertions(1);
    const wrapper = mount();
    expect(wrapper.exists("[data-test-id='extensions.empty']")).toEqual(true);
  });

  it('navigates to single extension', function() {
    expect.assertions(2);

    const wrapper = mount(extensions);

    expect($stateMocked.go).not.toHaveBeenCalled();
    wrapper
      .find('a')
      .first()
      .simulate('click');
    expect($stateMocked.go).toHaveBeenCalled();
  });

  it('lists extensions', function() {
    const wrapper = mount(extensions);

    expect(wrapper.find("[data-test-id='extensions.list']")).toHaveLength(1);

    const rows = wrapper.find('table tbody tr');
    expect(rows).toHaveLength(3);

    const firstRow = rows.find('tr').at(0);
    const secondRow = rows.find('tr').at(1);
    const thirdRow = rows.find('tr').at(2);

    const getColText = (row, index) =>
      row
        .children()
        .at(index)
        .text();

    // name
    expect(getColText(firstRow, 0)).toEqual('hello');
    expect(getColText(secondRow, 0)).toEqual('Widget 1');
    expect(getColText(thirdRow, 0)).toEqual('Widget 2');

    // fiels types
    expect(getColText(firstRow, 2)).toEqual('Boolean');
    expect(getColText(secondRow, 2)).toEqual('Number');
    expect(getColText(thirdRow, 2)).toEqual('Symbol, Text');

    // instance params
    expect(getColText(firstRow, 3)).toEqual('1 definition(s)');
    expect(getColText(secondRow, 3)).toEqual('0 definition(s)');
    expect(getColText(thirdRow, 3)).toEqual('0 definition(s)');

    // installation parameters
    expect(getColText(firstRow, 4)).toEqual('1 definition(s)0 value(s)');
    expect(getColText(secondRow, 4)).toEqual('0 definition(s)0 value(s)');
    expect(getColText(thirdRow, 4)).toEqual('0 definition(s)0 value(s)');
  });
});
