import React from 'react';
import Enzyme from 'enzyme';
import ExtensionsList from './ExtensionsList.es6';
import * as $stateMocked from 'ng/$state';

describe('app/settings/extensions/Extensions', () => {
  beforeEach(() => {
    $stateMocked.go.mockClear();
  });

  const mount = props => {
    const extensions = props.extensions || [];
    const refresh = props.refresh || jest.fn().mockResolvedValue({});
    const extensionUrl = props.extensionUrl || null;
    const wrapper = Enzyme.mount(
      <ExtensionsList extensions={extensions} refresh={refresh} extensionUrl={extensionUrl} />
    );
    return wrapper;
  };

  const extensions = [
    {
      id: 'builtin',
      name: 'Builtin',
      fieldTypes: ['Boolean'],
      parameters: ['one'],
      installationParameters: { definitions: ['some'], values: {} }
    },
    {
      custom: true,
      src: 'http://localhost',
      id: 'test',
      name: 'Widget 1',
      fieldTypes: ['Number'],
      parameters: [],
      installationParameters: { definitions: [], values: {} }
    },
    {
      custom: true,
      srcdoc: '<!doctype html',
      id: 'test2',
      name: 'Widget 2',
      fieldTypes: ['Symbol', 'Text'],
      parameters: [],
      installationParameters: { definitions: [], values: {} }
    }
  ];

  it('shows empty message', function() {
    expect.assertions(1);
    const wrapper = mount({
      extensions: [],
      refresh: jest.fn().mockResolvedValue({})
    });
    expect(wrapper.exists("[data-test-id='extensions.empty']")).toEqual(true);
  });

  it('navigates to single extension', function() {
    expect.assertions(2);

    const wrapper = mount({
      extensions,
      refresh: jest.fn().mockResolvedValue({})
    });

    expect($stateMocked.go).not.toHaveBeenCalled();
    wrapper
      .find('a')
      .first()
      .simulate('click');
    expect($stateMocked.go).toHaveBeenCalled();
  });

  it('lists extensions', function() {
    const wrapper = mount({
      extensions: extensions,
      refresh: jest.fn().mockResolvedValue({})
    });
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
    expect(getColText(firstRow, 0)).toEqual('Builtin');
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
