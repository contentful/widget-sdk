import React from 'react';
import Enzyme from 'enzyme';
import WebhookHeaders from 'app/Webhooks/WebhookHeaders';

describe('WebhookHeaders', function () {
  const mount = headers => {
    const onChangeStub = sinon.stub();
    const wrapper = Enzyme.mount(<WebhookHeaders
      headers={headers}
      onChange={onChangeStub}
    />);

    return [wrapper, onChangeStub];
  };

  const findHeaderRows = wrapper => wrapper.find('.webhook-editor__settings-row');

  it('lists no headers when none defined', function () {
    const [wrapper] = mount([]);
    const headerRows = findHeaderRows(wrapper);
    expect(headerRows.length).toBe(0);
  });

  it('renders headers', function () {
    const [wrapper] = mount([
      {key: 'X-Custom-Header-1', value: '123'},
      {key: 'X-Custom-Header-2', value: 'xyz'}
    ]);
    const headerRows = findHeaderRows(wrapper);
    expect(headerRows.length).toBe(2);

    const inputs = headerRows.find('input');
    ['X-Custom-Header-1', '123', 'X-Custom-Header-2', 'xyz'].forEach((value, i) => {
      expect(inputs.at(i).prop('value')).toBe(value);
    });
  });

  it('adds a new header', function () {
    const header = {key: 'X-Custom-Header-1', value: '123'};
    const [wrapper, onChangeStub] = mount([header]);
    const headerRows = findHeaderRows(wrapper);
    expect(headerRows.length).toBe(1);

    const addBtn = wrapper.find('.cfnext-form__field > button').first();
    addBtn.simulate('click');
    const withNew = [header, {}];
    sinon.assert.calledWith(onChangeStub, withNew);
    wrapper.setProps({headers: withNew});

    const inputs = wrapper.find('input');
    inputs.at(2).simulate('change', {target: {value: 'test-key'}});
    const withNewKey = [header, {key: 'test-key'}];
    sinon.assert.calledWith(onChangeStub, withNewKey);
    wrapper.setProps({headers: withNewKey});

    inputs.at(3).simulate('change', {target: {value: 'test-value'}});
    const withNewKeyAndValue = [header, {key: 'test-key', value: 'test-value'}];
    sinon.assert.calledWith(onChangeStub, withNewKeyAndValue);
  });

  it('removes a header', function () {
    const headers = [
      {key: 'X-Custom-Header-1', value: '123'},
      {key: 'X-Custom-Header-2', value: 'xyz'}
    ];

    const [wrapper, onChangeStub] = mount(headers);
    const headerRows = findHeaderRows(wrapper);
    expect(headerRows.length).toBe(2);

    const removeBtn = headerRows.last().find('button').first();
    removeBtn.simulate('click');
    sinon.assert.calledWith(onChangeStub, [headers[0]]);
  });
});
