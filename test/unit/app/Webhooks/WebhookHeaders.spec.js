import React from 'react';
import Enzyme from 'enzyme';

describe('WebhookHeaders', function() {
  let WebhookHeaders;

  const mount = headers => {
    const onChangeStub = sinon.stub();
    const wrapper = Enzyme.mount(<WebhookHeaders headers={headers} onChange={onChangeStub} />);

    return [wrapper, onChangeStub];
  };

  const findHeaderRows = wrapper => wrapper.find('.webhook-editor__settings-row');

  // We inject instead of importing so modalDialog is available
  beforeEach(function() {
    module('contentful/test');
    WebhookHeaders = this.$inject('app/Webhooks/WebhookHeaders').default;
  });

  it('lists no headers when none defined', function() {
    const [wrapper] = mount([]);
    const headerRows = findHeaderRows(wrapper);
    expect(headerRows.length).toBe(0);
  });

  it('renders headers', function() {
    const [wrapper] = mount([
      { key: 'X-Custom-Header-1', value: '123' },
      { key: 'X-Custom-Header-2', value: 'xyz' }
    ]);
    const headerRows = findHeaderRows(wrapper);
    expect(headerRows.length).toBe(2);

    const inputs = headerRows.find('input');
    ['X-Custom-Header-1', '123', 'X-Custom-Header-2', 'xyz'].forEach((value, i) => {
      expect(inputs.at(i).prop('value')).toBe(value);
    });
  });

  it('adds a new header', function() {
    const header = { key: 'X-Custom-Header-1', value: '123' };
    const [wrapper, onChangeStub] = mount([header]);
    const headerRows = findHeaderRows(wrapper);
    expect(headerRows.length).toBe(1);

    const addBtn = wrapper.find('.cfnext-form__field > button').first();
    addBtn.simulate('click');
    const withNew = [header, {}];
    sinon.assert.calledWith(onChangeStub, withNew);
    wrapper.setProps({ headers: withNew });

    const inputs = wrapper.find('input');
    inputs.at(2).simulate('change', { target: { value: 'test-key' } });
    const withNewKey = [header, { key: 'test-key' }];
    sinon.assert.calledWith(onChangeStub, withNewKey);
    wrapper.setProps({ headers: withNewKey });

    inputs.at(3).simulate('change', { target: { value: 'test-value' } });
    const withNewKeyAndValue = [header, { key: 'test-key', value: 'test-value' }];
    sinon.assert.calledWith(onChangeStub, withNewKeyAndValue);
  });

  it('removes a header', function() {
    const headers = [
      { key: 'X-Custom-Header-1', value: '123' },
      { key: 'X-Custom-Header-2', value: 'xyz' }
    ];

    const [wrapper, onChangeStub] = mount(headers);
    const headerRows = findHeaderRows(wrapper);
    expect(headerRows.length).toBe(2);

    const removeBtn = headerRows
      .last()
      .find('button')
      .first();
    removeBtn.simulate('click');
    sinon.assert.calledWith(onChangeStub, [headers[0]]);
  });

  it('renders secret headers disabled not exposing value', function() {
    const headers = [
      { key: 'test', value: 'public' },
      { key: 'test2', value: 'secret', secret: true }
    ];

    const [wrapper] = mount(headers);
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
