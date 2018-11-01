import React from 'react';
import Enzyme from 'enzyme';
import { WebhookHeaders } from './WebhookHeaders.es6';

describe('WebhookHeaders', () => {
  const shallow = headers => {
    const onChangeStub = jest.fn();
    const wrapper = Enzyme.shallow(<WebhookHeaders headers={headers} onChange={onChangeStub} />);

    return [wrapper, onChangeStub];
  };

  const findHeaderRows = wrapper => wrapper.find('.webhook-editor__settings-row');

  it('lists no headers when none defined', () => {
    const [wrapper] = shallow([]);
    const headerRows = findHeaderRows(wrapper);
    expect(headerRows).toHaveLength(0);
  });

  it('renders headers', () => {
    const [wrapper] = shallow([
      { key: 'X-Custom-Header-1', value: '123' },
      { key: 'X-Custom-Header-2', value: 'xyz' }
    ]);
    const headerRows = findHeaderRows(wrapper);
    expect(headerRows).toHaveLength(2);

    const inputs = headerRows.find('input');
    ['X-Custom-Header-1', '123', 'X-Custom-Header-2', 'xyz'].forEach((value, i) => {
      expect(inputs.at(i).prop('value')).toBe(value);
    });
  });

  it('adds a new header', () => {
    const header = { key: 'X-Custom-Header-1', value: '123' };
    const [wrapper, onChangeStub] = shallow([header]);
    const headerRows = findHeaderRows(wrapper);
    expect(headerRows).toHaveLength(1);

    const addBtn = wrapper.find('.cfnext-form__field > button').first();
    addBtn.simulate('click');
    const withNew = [header, {}];
    expect(onChangeStub).toHaveBeenCalledWith(withNew);
    wrapper.setProps({ headers: withNew });

    const inputs = wrapper.find('input');
    inputs.at(2).simulate('change', { target: { value: 'test-key' } });
    const withNewKey = [header, { key: 'test-key' }];
    expect(onChangeStub).toHaveBeenCalledWith(withNewKey);
    wrapper.setProps({ headers: withNewKey });

    inputs.at(3).simulate('change', { target: { value: 'test-value' } });
    const withNewKeyAndValue = [header, { key: 'test-key', value: 'test-value' }];
    expect(onChangeStub).toHaveBeenCalledWith(withNewKeyAndValue);
  });

  it('removes a header', () => {
    const headers = [
      { key: 'X-Custom-Header-1', value: '123' },
      { key: 'X-Custom-Header-2', value: 'xyz' }
    ];

    const [wrapper, onChangeStub] = shallow(headers);
    const headerRows = findHeaderRows(wrapper);
    expect(headerRows).toHaveLength(2);

    const removeBtn = headerRows
      .last()
      .find('button')
      .first();
    removeBtn.simulate('click');
    expect(onChangeStub).toHaveBeenCalledWith([headers[0]]);
  });

  it('renders secret headers disabled not exposing value', () => {
    const headers = [
      { key: 'test', value: 'public' },
      { key: 'test2', value: 'secret', secret: true }
    ];

    const [wrapper] = shallow(headers);
    const headerRows = findHeaderRows(wrapper);
    const inputs = headerRows.find('input');

    ['test', 'public', 'test2', undefined].forEach((value, i) => {
      expect(inputs.at(i).prop('value')).toBe(value);
    });
    expect(inputs.at(2).prop('disabled')).toBe(true);
    expect(inputs.at(3).prop('type')).toBe('password');
    expect(inputs.at(3).prop('readOnly')).toBe(true);
  });
});
