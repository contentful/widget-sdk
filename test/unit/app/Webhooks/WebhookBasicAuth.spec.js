import React from 'react';
import Enzyme from 'enzyme';
import WebhookBasicAuth from 'app/Webhooks/WebhookBasicAuth.es6';

describe('WebhookBasicAuth', function() {
  const mount = (stored, user = null, pass = null) => {
    const onChangeStub = sinon.stub();
    const wrapper = Enzyme.mount(
      <WebhookBasicAuth
        httpBasicUsername={user}
        httpBasicPassword={pass}
        hasHttpBasicStored={stored}
        onChange={onChangeStub}
      />
    );

    return [wrapper, onChangeStub];
  };

  it('only displays username if credentials are stored', function() {
    const PASSWORD = 'normally-null-but-lets-check';
    const [wrapper] = mount(true, 'jakub', PASSWORD);
    expect(
      wrapper
        .find('strong')
        .first()
        .text()
    ).toBe('jakub');
    expect(wrapper.html().includes(PASSWORD)).toBe(false);
  });

  it('allows to forget credentials if stored', function() {
    const [wrapper, onChangeStub] = mount(true, 'jakub');
    wrapper.find('button').simulate('click');
    sinon.assert.calledWith(onChangeStub, { httpBasicPassword: null, httpBasicUsername: null });
  });

  it('displays form if credentials are not stored', function() {
    [[], ['jakub'], [null, 'pass'], ['jakub', 'pass']].forEach(([user, pass]) => {
      const [wrapper] = mount(false, user, pass);
      expect(wrapper.find('strong').length).toBe(0);
      const inputs = wrapper.find('input');
      expect(inputs.length).toBe(2);
      expect(inputs.at(0).prop('value')).toBe(user || '');
      expect(inputs.at(1).prop('value')).toBe(pass || '');
    });
  });

  it('updates values when editing the form', function() {
    const [wrapper, onChangeStub] = mount(false);
    const inputs = wrapper.find('input');

    inputs.at(0).simulate('change', { target: { value: 'test' } });
    sinon.assert.calledWith(onChangeStub, { httpBasicUsername: 'test' });

    inputs.at(1).simulate('change', { target: { value: 'test' } });
    sinon.assert.calledWith(onChangeStub, { httpBasicPassword: 'test' });
  });

  it('nullifies values when emptying inputs', function() {
    const [wrapper, onChangeStub] = mount(false, 'test', 'test');
    const inputs = wrapper.find('input');

    inputs.at(0).simulate('change', { target: { value: '' } });
    sinon.assert.calledWith(onChangeStub, { httpBasicUsername: null });

    inputs.at(1).simulate('change', { target: { value: '' } });
    sinon.assert.calledWith(onChangeStub, { httpBasicPassword: null });
  });
});
