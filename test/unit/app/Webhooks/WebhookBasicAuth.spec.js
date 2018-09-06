import React from 'react';
import Enzyme from 'enzyme';
import WebhookBasicAuth from 'app/Webhooks/WebhookBasicAuth.es6';

describe('WebhookBasicAuth', function() {
  const mount = user => {
    const onChangeStub = sinon.stub();
    const wrapper = Enzyme.mount(
      <WebhookBasicAuth httpBasicUsername={user} onChange={onChangeStub} />
    );

    return [wrapper, onChangeStub];
  };

  it('does not show up if credentials are not stored', function() {
    const [wrapper] = mount(undefined);
    expect(wrapper.children().length).toBe(0);
  });

  it('only displays username if credentials are stored', function() {
    const [wrapper] = mount('jakub');
    expect(
      wrapper
        .find('strong')
        .first()
        .text()
    ).toBe('jakub');
  });

  it('allows to forget credentials if stored', function() {
    const [wrapper, onChangeStub] = mount('jakub');
    wrapper.find('button').simulate('click');
    sinon.assert.calledWith(onChangeStub, { httpBasicPassword: null, httpBasicUsername: null });
  });
});
